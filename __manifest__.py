{
    'name': 'Information Campaign',
    'version': '17.0.1.0.0',
    'category': 'Tools',
    'summary': 'Système de pop-up d\'information pour communication interne',
    'description': """
        Module permettant d'afficher des pop-ups informatifs aux utilisateurs
        lors de leur connexion ou rechargement de page.
    """,
    'author': 'Diomande Franck Vianney',
    'depends': ['base', 'web','mail'],
    'data': [
        'security/information_campaign_security.xml',  # ← NOUVEAU
        'security/ir.model.access.csv',
        'views/information_campaign_views.xml',
        'views/menu_views.xml',
        # 'data/cron_data.xml',
    ],
    'assets': {
    'web.assets_backend': [
        'information_campaign/static/src/js/campaign_popup_overlay.js',
    ],
},

    'installable': True,
    'application': False,
    'auto_install': False,
}
