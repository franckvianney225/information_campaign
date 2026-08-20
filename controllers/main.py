from odoo import http
from odoo.http import request
import logging

_logger = logging.getLogger(__name__)

class CampaignPopupController(http.Controller):

    @http.route('/campaign/active', type='json', auth='user')
    def get_active_campaign(self):
        """Retourne TOUTES les campagnes actives pour l'utilisateur connecté"""
        try:
            _logger.info("=== DEBUT get_active_campaign ===")
            _logger.info(f"User ID: {request.env.user.id}")
            
            # ✅ Utiliser sudo() pour lire les campagnes
            campaigns = request.env['information.campaign'].sudo().get_all_active_campaigns_for_user()
            _logger.info(f"Campaigns found: {len(campaigns)}")
            
            if campaigns:
                result = []
                for campaign in campaigns:
                    result.append({
                        'id': campaign.id,
                        'name': campaign.name,
                        'description': campaign.description,
                        'priority': campaign.priority,
                        'show_once': campaign.show_once,
                        'repeat_display': campaign.repeat_display,
                        'repeat_interval': campaign.repeat_interval,
                        'repeat_unit': campaign.repeat_unit,
                    })
                _logger.info(f"Returning {len(result)} campaigns")
                return result
            else:
                _logger.info("No active campaigns found")
                return []
                
        except Exception as e:
            _logger.error(f"Erreur dans get_active_campaign: {str(e)}")
            return {'error': str(e)}

    @http.route('/campaign/mark_viewed', type='json', auth='user')
    def mark_campaign_viewed(self, campaign_id):
        """Marque une campagne comme vue"""
        try:
            current_user_id = request.env.user.id
            _logger.info(f"Marking campaign {campaign_id} as viewed for user {current_user_id}")
            
            # ✅ SOLUTION : Utiliser sudo() pour contourner les permissions
            campaign = request.env['information.campaign'].sudo().browse(campaign_id)
            if campaign.exists():
                campaign.mark_as_viewed(user_id=current_user_id)
                _logger.info("Campaign marked as viewed successfully")
                return {'success': True}
            else:
                _logger.error(f"Campaign {campaign_id} not found")
                return {'error': 'Campagne non trouvée'}
                
        except Exception as e:
            _logger.error(f"Erreur dans mark_campaign_viewed: {str(e)}")
            return {'error': str(e)}
