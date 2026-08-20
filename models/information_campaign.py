from odoo import models, fields, api
from datetime import datetime, timedelta

class InformationCampaign(models.Model):
    _name = 'information.campaign'
    _description = 'Campagne d\'Information'
    _inherit = ['mail.thread', 'mail.activity.mixin']    
    _order = 'start_date desc'

    name = fields.Char('Titre', required=True, size=100)
    description = fields.Html('Description', required=True)
    start_date = fields.Datetime('Date de début', required=True, default=fields.Datetime.now)
    end_date = fields.Datetime('Date de fin', required=True)
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('active', 'Active'),
        ('expired', 'Expirée'),
        ('cancelled', 'Annulée'),
    ], default='draft', string='État')
    
    priority = fields.Selection([
        ('low', 'Basse'),
        ('normal', 'Normale'),
        ('high', 'Haute'),
        ('urgent', 'Urgente'),
    ], default='normal', string='Priorité')
    
    target_users = fields.Many2many('res.users', string='Utilisateurs ciblés',
                                   help='Si vide, tous les utilisateurs verront le pop-up')
    
    show_once = fields.Boolean('Afficher une seule fois par utilisateur', default=True)
    
    # NOUVEAUX CHAMPS POUR L'INTERVALLE
    repeat_display = fields.Boolean('Réafficher périodiquement', default=False,
                                   help='Si activé, la campagne sera réaffichée après l\'intervalle défini')
    
    repeat_interval = fields.Integer('Intervalle de répétition', default=24,
                                   help='Nombre d\'unités de temps avant de réafficher la campagne')
    
    repeat_unit = fields.Selection([
        ('minutes', 'Minutes'),
        ('hours', 'Heures'),
        ('days', 'Jours'),
    ], default='hours', string='Unité de temps')
    
    viewed_users = fields.Many2many('res.users', 'campaign_user_viewed_rel', 
                                   string='Utilisateurs ayant vu')
    
    # Relation vers l'historique des vues
    view_history_ids = fields.One2many('information.campaign.view.history', 'campaign_id', 
                                      string='Historique des vues')
    
    active = fields.Boolean(default=True)

    @api.model
    def get_all_active_campaigns_for_user(self, user_id=None):
        """Récupère TOUTES les campagnes actives pour un utilisateur donné avec gestion de l'intervalle"""
        import logging
        _logger = logging.getLogger(__name__)
        
        if not user_id:
            user_id = self.env.user.id
            
        _logger.info(f"=== Checking ALL campaigns for user {user_id} ===")
        
        # ✅ CORRECTION : Récupérer l'utilisateur spécifique
        target_user = self.env['res.users'].browse(user_id)
        
        now = fields.Datetime.now()
        _logger.info(f"Current time: {now}")
        
        domain = [
            ('state', '=', 'active'),
            ('start_date', '<=', now),
            ('end_date', '>=', now),
            ('active', '=', True)
        ]
        
        campaigns = self.search(domain, order='priority desc, start_date desc')
        _logger.info(f"Found {len(campaigns)} campaigns matching criteria")
        
        valid_campaigns = []
        
        for campaign in campaigns:
            _logger.info(f"Checking campaign: {campaign.name} (ID: {campaign.id})")
            
            # ✅ CORRECTION : Vérifier si l'utilisateur spécifique est ciblé
            if campaign.target_users:
                _logger.info(f"Campaign has targeted users: {campaign.target_users.mapped('name')}")
                if target_user not in campaign.target_users:
                    _logger.info("User not in target list, skipping")
                    continue
            else:
                _logger.info("Campaign targets all users")
            
            # Vérifier l'intervalle de temps avec la nouvelle logique
            if not self._should_display_campaign_to_user(campaign, user_id, now):
                _logger.info("Campaign should not be displayed due to time interval, skipping")
                continue
            
            _logger.info(f"Adding campaign to valid list: {campaign.name}")
            valid_campaigns.append(campaign)
            
        _logger.info(f"Returning {len(valid_campaigns)} valid campaigns")
        return valid_campaigns

    def _should_display_campaign_to_user(self, campaign, user_id, current_time):
        """Détermine si une campagne doit être affichée à un utilisateur en fonction de l'intervalle"""
        import logging
        _logger = logging.getLogger(__name__)
        
        # ✅ CORRECTION : Utiliser l'utilisateur spécifique, pas self.env.user
        target_user = self.env['res.users'].browse(user_id)
        
        # Si repeat_display est False, utiliser l'ancienne logique
        if not campaign.repeat_display:
            if campaign.show_once:
                if target_user in campaign.viewed_users:  # ✅ CORRIGÉ
                    _logger.info("Campaign set to show once and user already viewed it")
                    return False
                else:
                    _logger.info("Campaign set to show once and user hasn't viewed it yet")
                    return True
            else:
                _logger.info("Campaign has no restrictions, always showing")
                return True
        
        # Si repeat_display est True, vérifier l'historique des vues avec intervalle
        last_view = self.env['information.campaign.view.history'].search([
            ('campaign_id', '=', campaign.id),
            ('user_id', '=', user_id)  # ✅ Utilise le bon user_id
        ], order='view_date desc', limit=1)
        
        if not last_view:
            _logger.info("No previous view found, showing campaign")
            return True
        
        # Calculer l'intervalle
        interval_mapping = {
            'minutes': lambda x: timedelta(minutes=x),
            'hours': lambda x: timedelta(hours=x),
            'days': lambda x: timedelta(days=x),
        }
        
        interval_delta = interval_mapping[campaign.repeat_unit](campaign.repeat_interval)
        next_display_time = last_view.view_date + interval_delta
        
        _logger.info(f"Last view: {last_view.view_date}, Next display: {next_display_time}, Current: {current_time}")
        
        if current_time >= next_display_time:
            _logger.info("Enough time has passed, showing campaign")
            return True
        else:
            _logger.info(f"Not enough time passed. Need to wait until {next_display_time}")
            return False

    def action_launch(self):
        """Lance la campagne manuellement"""
        self.write({'state': 'active'})
        return True

    def action_cancel(self):
        """Annule la campagne"""
        self.write({'state': 'cancelled'})
        return True

    def mark_as_viewed(self, user_id=None):
        """Marque la campagne comme vue par un utilisateur avec horodatage"""
        import logging
        _logger = logging.getLogger(__name__)
        
        if not user_id:
            user_id = self.env.user.id
        
        _logger.info(f"=== MARK AS VIEWED DEBUG ===")
        _logger.info(f"Campaign ID: {self.id}")
        _logger.info(f"User ID to mark: {user_id}")
        _logger.info(f"Current env.user: {self.env.user.id}")
        
        user = self.env['res.users'].browse(user_id)
        _logger.info(f"User name: {user.name}")
        
        # Ajouter à la liste des utilisateurs ayant vu
        if user not in self.viewed_users:
            self.viewed_users = [(4, user.id)]
            _logger.info(f"Added user {user.name} to viewed_users")
        else:
            _logger.info(f"User {user.name} already in viewed_users")
        
        # Créer l'entrée dans l'historique
        view_history = self.env['information.campaign.view.history'].create({
            'campaign_id': self.id,
            'user_id': user_id,
            'view_date': fields.Datetime.now()
        })
        _logger.info(f"Created view history entry: {view_history.id}")
        
        _logger.info(f"=== END MARK AS VIEWED DEBUG ===")

    @api.model
    def cron_auto_launch_campaigns(self):
        """Méthode appelée par le cron pour lancer automatiquement les campagnes"""
        now = fields.Datetime.now()
        campaigns_to_launch = self.search([
            ('state', '=', 'draft'),
            ('start_date', '<=', now)
        ])
        campaigns_to_launch.write({'state': 'active'})
        return True

    @api.model
    def cron_auto_expire_campaigns(self):
        """Méthode appelée par le cron pour expirer automatiquement les campagnes"""
        now = fields.Datetime.now()
        campaigns_to_expire = self.search([
            ('state', '=', 'active'),
            ('end_date', '<', now)
        ])
        campaigns_to_expire.write({'state': 'expired'})
        return True

    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        for record in self:
            if record.start_date >= record.end_date:
                raise models.ValidationError("La date de fin doit être postérieure à la date de début.")

    @api.constrains('repeat_interval')
    def _check_repeat_interval(self):
        for record in self:
            if record.repeat_display and record.repeat_interval <= 0:
                raise models.ValidationError("L'intervalle de répétition doit être supérieur à 0.")


# NOUVEAU MODÈLE POUR L'HISTORIQUE DES VUES
class InformationCampaignViewHistory(models.Model):
    _name = 'information.campaign.view.history'
    _description = 'Historique des vues de campagne'
    _order = 'view_date desc'

    campaign_id = fields.Many2one('information.campaign', string='Campagne', required=True, ondelete='cascade')
    user_id = fields.Many2one('res.users', string='Utilisateur', required=True, ondelete='cascade')
    view_date = fields.Datetime('Date de vue', required=True, default=fields.Datetime.now)
