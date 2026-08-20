/** @odoo-module **/

import { registry } from "@web/core/registry";
import { browser } from "@web/core/browser/browser";

const campaignPopupService = {
    dependencies: ["rpc"],
    
    start(env, { rpc }) {
        console.log("Campaign popup service started");
        
        // Vérifier les campagnes après un délai
        browser.setTimeout(async () => {
            await this.checkForActiveCampaigns(rpc);
        }, 500);
        
        return {};
    },

    async checkForActiveCampaigns(rpc) {
        try {
            console.log("Checking for active campaigns...");
            
            const campaigns = await rpc("/campaign/active");
            console.log("Campaigns response:", campaigns);
            
            if (campaigns && campaigns.length > 0 && !campaigns.error) {
                console.log(`Found ${campaigns.length} campaigns to display`);
                // Afficher les campagnes en séquence
                await this.showCampaignsSequentially(campaigns, rpc);
            } else {
                console.log("No active campaigns found");
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des campagnes:", error);
        }
    },

    async showCampaignsSequentially(campaigns, rpc) {
        for (let i = 0; i < campaigns.length; i++) {
            const campaign = campaigns[i];
            console.log(`Showing campaign ${i + 1}/${campaigns.length}: ${campaign.name}`);
            
            // Attendre que l'utilisateur ferme la campagne actuelle avant de passer à la suivante
            await this.showCampaignOverlay(campaign, rpc, i + 1, campaigns.length);
        }
        console.log("All campaigns have been displayed");
    },

    async showCampaignOverlay(campaign, rpc, currentIndex, totalCount) {
        return new Promise((resolve) => {
            // Créer l'overlay
            const overlay = document.createElement('div');
            overlay.className = 'campaign-overlay';
            overlay.innerHTML = this.createPopupHTML(campaign, currentIndex, totalCount);
            
            // Ajouter les styles
            this.addStyles();
            
            // Ajouter au DOM
            document.body.appendChild(overlay);
            
            // Gérer les événements
            const confirmBtn = overlay.querySelector('.campaign-confirm-btn');
            const cancelBtn = overlay.querySelector('.campaign-cancel-btn');
            const closeBtn = overlay.querySelector('.campaign-close-btn');
            
            const handleClose = async () => {
                console.log(`Closing campaign: ${campaign.name}`);
                
                // ✅ CORRECTION : Toujours marquer comme vu (pour show_once ET repeat_display)
                await this.markAsViewed(campaign.id, rpc);
                
                // Animation de sortie
                overlay.classList.add('closing');
                
                setTimeout(() => {
                    overlay.remove();
                    resolve(); // Résoudre la promesse pour passer à la campagne suivante
                }, 300);
            };
            
            confirmBtn.addEventListener('click', handleClose);
            cancelBtn.addEventListener('click', handleClose);
            closeBtn.addEventListener('click', handleClose);
            
            // Fermer en cliquant sur l'overlay
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    handleClose();
                }
            });
            
            // Gérer la touche Echap
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleClose();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
            
            // Animation d'entrée
            setTimeout(() => {
                overlay.classList.add('show');
            }, 100);
        });
    },

    createPopupHTML(campaign, currentIndex, totalCount) {
        const priorityConfig = {
            'urgent': { color: '#dc3545', bg: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)', label: '🚨 Urgent' },
            'high': { color: '#fd7e14', bg: 'linear-gradient(135deg, #fde2d3 0%, #fcd5b5 100%)', label: '⚠️ Haute' },
            'normal': { color: '#0d6efd', bg: 'linear-gradient(135deg, #cce7ff 0%, #b3d9ff 100%)', label: 'ℹ️ Normale' },
            'low': { color: '#6c757d', bg: 'linear-gradient(135deg, #e2e3e5 0%, #d3d4d6 100%)', label: '📝 Basse' }
        };

        const config = priorityConfig[campaign.priority] || priorityConfig['normal'];
        const currentDate = new Date().toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Indicateur de progression si plusieurs campagnes
        const progressIndicator = totalCount > 1 ? `
            <div class="campaign-progress">
                <span class="campaign-counter">${currentIndex} / ${totalCount}</span>
                <div class="campaign-progress-bar">
                    <div class="campaign-progress-fill" style="width: ${(currentIndex / totalCount) * 100}%"></div>
                </div>
            </div>
        ` : '';

        // ✅ AMÉLIORATION : Afficher l'info sur la répétition
        const repeatInfo = campaign.repeat_display ? `
            <div class="campaign-repeat-info">
                <small>
                    <i class="fa fa-refresh"></i>
                    Réaffichage programmé toutes les ${campaign.repeat_interval} ${this.getUnitLabel(campaign.repeat_unit)}
                </small>
            </div>
        ` : '';

        return `
            <div class="campaign-popup-modal">
                <div class="campaign-header" style="background: ${config.bg}; border-bottom: 3px solid ${config.color};">
                    <div class="campaign-header-content">
                        <h3 class="campaign-title">
                            <i class="fa fa-bullhorn"></i>
                            ${campaign.name}
                        </h3>
                        <button class="campaign-close-btn" type="button">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                    <div class="campaign-header-bottom">
                        <div class="campaign-priority-badge" style="background-color: ${config.color};">
                            ${config.label}
                        </div>
                        ${progressIndicator}
                    </div>
                </div>
                
                <div class="campaign-body">
                    <div class="campaign-content">
                        ${campaign.description}
                    </div>
                    
                    <div class="campaign-info">
                        <small>
                            <i class="fa fa-clock-o"></i>
                            Message affiché le ${currentDate}
                        </small>
                        ${repeatInfo}
                    </div>
                </div>
                
                <div class="campaign-footer">
                    <button class="campaign-cancel-btn btn-secondary" type="button">
                        <i class="fa fa-times"></i>
                        Fermer
                    </button>
                    <button class="campaign-confirm-btn btn-primary" type="button">
                        <i class="fa fa-check"></i>
                        J'ai lu ${totalCount > 1 ? `(${currentIndex}/${totalCount})` : ''}
                    </button>
                </div>
            </div>
        `;
    },

    // ✅ NOUVELLE FONCTION : Traduire les unités
    getUnitLabel(unit) {
        const labels = {
            'minutes': 'minute(s)',
            'hours': 'heure(s)',
            'days': 'jour(s)'
        };
        return labels[unit] || unit;
    },

    addStyles() {
        if (document.getElementById('campaign-popup-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'campaign-popup-styles';
        styles.textContent = `
            .campaign-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(2px);
            }
            
            .campaign-overlay.show {
                opacity: 1;
            }
            
            .campaign-overlay.closing {
                opacity: 0;
                transform: scale(0.95);
            }
            
            .campaign-popup-modal {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                transform: translateY(-20px);
                transition: transform 0.3s ease;
            }
            
            .campaign-overlay.show .campaign-popup-modal {
                transform: translateY(0);
            }
            
            .campaign-header {
                padding: 1.5rem;
                border-radius: 12px 12px 0 0;
            }
            
            .campaign-header-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 1rem;
            }
            
            .campaign-header-bottom {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 1rem;
            }
            
            .campaign-title {
                margin: 0;
                font-size: 1.4em;
                font-weight: 600;
                color: #2c3e50;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .campaign-close-btn {
                background: none;
                border: none;
                font-size: 1.2em;
                color: #666;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .campaign-close-btn:hover {
                background-color: rgba(0, 0, 0, 0.1);
            }
            
            .campaign-priority-badge {
                display: inline-block;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.9em;
                font-weight: 600;
            }
            
            .campaign-progress {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                min-width: 120px;
            }
            
            .campaign-counter {
                font-size: 0.85em;
                font-weight: 600;
                color: #2c3e50;
                min-width: 40px;
            }
            
            .campaign-progress-bar {
                flex: 1;
                height: 4px;
                background-color: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .campaign-progress-fill {
                height: 100%;
                background-color: rgba(255, 255, 255, 0.8);
                border-radius: 2px;
                transition: width 0.3s ease;
            }
            
            .campaign-body {
                padding: 2rem 1.5rem;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .campaign-content {
                font-size: 1.1em;
                line-height: 1.6;
                color: #333;
                margin-bottom: 1.5rem;
            }
            
            .campaign-content h1, .campaign-content h2, .campaign-content h3 {
                color: #2c3e50;
                margin-bottom: 1rem;
            }
            
            .campaign-content p {
                margin-bottom: 1rem;
            }
            
            .campaign-info {
                background-color: #f8f9fa;
                padding: 0.75rem 1rem;
                border-radius: 6px;
                border-left: 4px solid #0d6efd;
            }
            
            .campaign-info small {
                color: #6c757d;
                font-size: 0.9em;
            }
            
            /* ✅ NOUVEAU : Style pour l'info de répétition */
            .campaign-repeat-info {
                margin-top: 0.5rem;
                padding-top: 0.5rem;
                border-top: 1px solid #e9ecef;
            }
            
            .campaign-repeat-info small {
                color: #28a745;
                font-weight: 500;
            }
            
            .campaign-footer {
                padding: 1rem 1.5rem;
                background-color: #f8f9fa;
                border-top: 1px solid #dee2e6;
                display: flex;
                justify-content: flex-end;
                gap: 0.75rem;
            }
            
            .campaign-footer button {
                padding: 0.6rem 1.5rem;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            

            @media (max-width: 768px) {
                .campaign-popup-modal {
                    width: 95%;
                    margin: 1rem;
                }
                
                .campaign-header, .campaign-body, .campaign-footer {
                    padding: 1rem;
                }
                
                .campaign-content {
                    font-size: 1em;
                }
                
                .campaign-footer {
                    flex-direction: column;
                }
                
                .campaign-footer button {
                    width: 100%;
                    justify-content: center;
                }
                
                .campaign-header-bottom {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .campaign-progress {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(styles);
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
