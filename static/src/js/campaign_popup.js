/** @odoo-module **/

import { Component, useState, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { browser } from "@web/core/browser/browser";
import { Dialog } from "@web/core/dialog/dialog";

export class CampaignPopupDialog extends Component {
    static template = "information_campaign.CampaignPopupTemplate";
    static components = { Dialog };
    static props = {
        campaign: Object,
        close: Function,
    };

    setup() {
        this.state = useState({
            campaign: this.props.campaign
        });
    }

    getCurrentDate() {
        return new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async onConfirm() {
        console.log("User confirmed reading the campaign");
        if (this.state.campaign.show_once) {
            await this.markAsViewed();
        }
        this.props.close();
    }

    async onCancel() {
        console.log("User cancelled the campaign");
        if (this.state.campaign.show_once) {
            await this.markAsViewed();
        }
        this.props.close();
    }

    async markAsViewed() {
        try {
            const rpc = useService("rpc");
            await rpc("/campaign/mark_viewed", {
                campaign_id: this.state.campaign.id
            });
        } catch (error) {
            console.error("Erreur lors du marquage comme vu:", error);
        }
    }
}

const campaignPopupService = {
    dependencies: ["rpc", "dialog"],
    
    start(env, { rpc, dialog }) {
        console.log("Campaign popup service started");
        
        // Vérifier les campagnes après un délai
        browser.setTimeout(async () => {
            await this.checkForActiveCampaign(rpc, dialog);
        }, 3000);
        
        return {};
    },

    async checkForActiveCampaign(rpc, dialog) {
        try {
            console.log("Checking for active campaign...");
            
            const campaign = await rpc("/campaign/active");
            console.log("Campaign response:", campaign);
            
            if (campaign && !campaign.error) {
                this.showCampaignPopup(campaign, rpc, dialog);
            } else {
                console.log("No active campaign found");
            }
        } catch (error) {
            console.error("Erreur lors de la récupération de la campagne:", error);
        }
    },

    async showCampaignPopup(campaign, rpc, dialog) {
        // Créer le popup avec du HTML personnalisé
        const priorityColors = {
            'urgent': '#dc3545',
            'high': '#fd7e14',
            'normal': '#0d6efd',
            'low': '#6c757d'
        };

        const priorityLabels = {
            'urgent': '🚨 Urgent',
            'high': '⚠️ Haute',
            'normal': 'ℹ️ Normale',
            'low': '📝 Basse'
        };

        const priorityBgColors = {
            'urgent': 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
            'high': 'linear-gradient(135deg, #fde2d3 0%, #fcd5b5 100%)',
            'normal': 'linear-gradient(135deg, #cce7ff 0%, #b3d9ff 100%)',
            'low': 'linear-gradient(135deg, #e2e3e5 0%, #d3d4d6 100%)'
        };

        const currentDate = new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const htmlContent = `
            <div class="campaign-popup-custom">
                <style>
                    .campaign-popup-custom {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    .campaign-header-custom {
                        background: ${priorityBgColors[campaign.priority]};
                        padding: 1.5rem;
                        border-radius: 8px 8px 0 0;
                        border-bottom: 3px solid ${priorityColors[campaign.priority]};
                        margin: -1rem -1rem 0 -1rem;
                    }
                    .campaign-title-custom {
                        font-size: 1.4em;
                        font-weight: 600;
                        margin: 0;
                        color: #2c3e50;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    .priority-badge-custom {
                        background-color: ${priorityColors[campaign.priority]};
                        color: white;
                        padding: 0.4rem 0.8rem;
                        border-radius: 20px;
                        font-size: 0.85em;
                        font-weight: 600;
                        margin-left: auto;
                    }
                    .campaign-content-custom {
                        padding: 1.5rem 0;
                        font-size: 1.1em;
                        line-height: 1.6;
                        color: #333;
                    }
                    .campaign-content-custom h1, 
                    .campaign-content-custom h2, 
                    .campaign-content-custom h3 {
                        color: #2c3e50;
                        margin-bottom: 1rem;
                    }
                    .campaign-content-custom p {
                        margin-bottom: 1rem;
                    }
                    .campaign-info-custom {
                        background-color: #f8f9fa;
                        padding: 0.75rem 1rem;
                        border-radius: 6px;
                        border-left: 4px solid ${priorityColors[campaign.priority]};
                        margin-top: 1rem;
                    }
                    .campaign-info-custom small {
                        color: #6c757d;
                        font-size: 0.9em;
                    }
                </style>
                
                <div class="campaign-header-custom">
                    <h3 class="campaign-title-custom">
                        <i class="fa fa-bullhorn"></i>
                        ${campaign.name}
                        <span class="priority-badge-custom">${priorityLabels[campaign.priority]}</span>
                    </h3>
                </div>
                
                <div class="campaign-content-custom">
                    ${campaign.description}
                </div>
                
                <div class="campaign-info-custom">
                    <small>
                        <i class="fa fa-clock-o"></i>
                        Message affiché le ${currentDate}
                    </small>
                </div>
            </div>
        `;

        dialog.add("web.ConfirmationDialog", {
            title: "📢 Information Importante",
            body: htmlContent,
            size: "lg",
            confirm: async () => {
                console.log("User confirmed reading the campaign");
                if (campaign.show_once) {
                    await this.markAsViewed(campaign.id, rpc);
                }
            },
            confirmLabel: "✓ J'ai lu",
            cancel: async () => {
                console.log("User cancelled the campaign");
                if (campaign.show_once) {
                    await this.markAsViewed(campaign.id, rpc);
                }
            },
            cancelLabel: "✕ Fermer"
        });
    },

    async markAsViewed(campaignId, rpc) {
        try {
            console.log("Marking campaign as viewed:", campaignId);
            const result = await rpc("/campaign/mark_viewed", {
                campaign_id: campaignId
            });
            console.log("Mark as viewed result:", result);
        } catch (error) {
            console.error("Erreur lors du marquage comme vu:", error);
        }
    }
};

// Enregistrer le service
registry.category("services").add("campaign_popup", campaignPopupService);

console.log("Campaign popup module loaded");
