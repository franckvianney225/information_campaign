Voici le fichier README.md complet :

```markdown
# 📢 Information Campaign - Module Odoo 17

## 📋 Description

**Information Campaign** est un module Odoo 17 permettant d'afficher des pop-ups informatifs aux utilisateurs lors de leur connexion ou rechargement de page. Idéal pour la communication interne d'entreprise.

## ✨ Fonctionnalités

### 🎯 Gestion des Campagnes
- ✅ Création de campagnes d'information avec titre et description HTML
- ✅ Gestion des dates de début et fin
- ✅ Système d'états : Brouillon → Active → Expirée/Annulée
- ✅ Niveaux de priorité : Basse, Normale, Haute, Urgente
- ✅ Ciblage d'utilisateurs spécifiques ou tous les utilisateurs

### ⏰ Modes d'Affichage
- **Mode "Une seule fois"** : L'utilisateur voit la campagne une seule fois
- **Mode "À chaque fois"** : Affichage à chaque connexion/actualisation
- **Mode "Répétition programmée"** : Réaffichage après un intervalle défini (minutes/heures/jours)

### 🎨 Interface Utilisateur
- ✅ Pop-up moderne et responsive avec design adaptatif selon la priorité
- ✅ Affichage séquentiel de plusieurs campagnes actives
- ✅ Indicateur de progression pour plusieurs campagnes
- ✅ Support HTML complet dans les descriptions
- ✅ Animations d'entrée et de sortie

### 📊 Suivi et Statistiques
- ✅ Historique détaillé des vues par utilisateur avec horodatage
- ✅ Liste des utilisateurs ayant vu chaque campagne
- ✅ Statistiques d'affichage et de lecture

### 🔐 Sécurité et Permissions
- ✅ Groupe "Administrateur Campagnes" pour la gestion complète
- ✅ Groupe "Utilisateur Campagnes" pour la lecture seule
- ✅ Tous les utilisateurs peuvent voir les pop-ups

### ⚙️ Automatisation
- ✅ Lancement automatique des campagnes (cron toutes les 5 minutes)
- ✅ Expiration automatique des campagnes (cron toutes les heures)

## 🏗️ Structure du Module

```
information_campaign/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── information_campaign.py
├── controllers/
│   ├── __init__.py
│   └── campaign_controller.py
├── views/
│   ├── information_campaign_views.xml
│   └── menu_views.xml
├── security/
│   ├── information_campaign_security.xml
│   └── ir.model.access.csv
├── data/
│   └── cron_data.xml
└── static/
    └── src/
        └── js/
            └── campaign_popup_overlay.js
```

## 📦 Installation

### Prérequis
- Odoo 17.0 CE/EE
- Modules de base : `base`, `web`

### Étapes d'installation
1. Copiez le dossier `information_campaign` dans votre répertoire `addons`
2. Redémarrez le serveur Odoo
3. Allez dans **Applications** → **Mettre à jour la liste des applications**
4. Recherchez "Information Campaign" et cliquez sur **Installer**

## ⚙️ Configuration

### 1. Attribution des Permissions
1. Allez dans **Paramètres** → **Utilisateurs et Sociétés** → **Utilisateurs**
2. Sélectionnez un utilisateur
3. Dans l'onglet **Droits d'accès**, section **Communication Interne**
4. Cochez **Administrateur Campagnes** pour donner tous les droits

### 2. Accès au Module
- Menu principal : **Communication** → **Campagnes d'Information**
- Historique : **Communication** → **Historique des vues**

## 🚀 Utilisation

### Créer une Campagne

1. **Informations de base :**
   - **Titre** : Nom de la campagne (obligatoire)
   - **Description** : Contenu HTML de la campagne (obligatoire)
   - **Priorité** : Basse/Normale/Haute/Urgente
   - **Dates** : Date de début et fin

2. **Paramètres d'affichage :**
   - **Afficher une seule fois** : Cochez pour un affichage unique
   - **Réafficher périodiquement** : Cochez pour une répétition
   - **Intervalle** : Nombre d'unités de temps
   - **Unité** : Minutes/Heures/Jours

3. **Ciblage :**
   - Laissez vide pour **tous les utilisateurs**
   - Sélectionnez des utilisateurs pour un **ciblage spécifique**

4. **Lancement :**
   - Cliquez sur **Lancer** pour activer immédiatement
   - Ou laissez le système lancer automatiquement à la date de début

### Exemples d'Usage

#### 📢 Annonce Ponctuelle
```
Titre: "Nouvelle politique de télétravail"
Mode: Une seule fois
Priorité: Normale
Ciblage: Tous les utilisateurs
```

#### ⚠️ Rappel de Sécurité
```
Titre: "Rappel : Verrouillage d'écran"
Mode: Répétition toutes les 8 heures
Priorité: Haute
Ciblage: Tous les utilisateurs
```

#### 🚨 Alerte Urgente
```
Titre: "Maintenance serveur dans 1 heure"
Mode: Répétition toutes les 15 minutes
Priorité: Urgente
Ciblage: Équipe IT
```

#### 📝 Information Temporaire
```
Titre: "Cantine fermée aujourd'hui"
Mode: À chaque fois
Priorité: Basse
Durée: 1 jour
```

## 🎨 Personnalisation

### Modifier le Délai d'Apparition
Dans `static/src/js/campaign_popup_overlay.js`, ligne ~15 :
```javascript
browser.setTimeout(async () => {
    await this.checkForActiveCampaigns(rpc);
}, 1500);  // Modifiez cette valeur (en millisecondes)
```

### Personnaliser les Couleurs
Les couleurs par priorité sont définies dans le JavaScript :
```javascript
const priorityConfig = {
    'urgent': { color: '#dc3545', bg: 'linear-gradient(...)', label: '🚨 Urgent' },
    'high': { color: '#fd7e14', bg: 'linear-gradient(...)', label: '⚠️ Haute' },
    // ...
};
```

## 🔧 API et Intégration

### Routes Disponibles
- **GET** `/campaign/active` : Récupère les campagnes actives pour l'utilisateur
- **POST** `/campaign/mark_viewed` : Marque une campagne comme vue

### Modèles de Données

#### `information.campaign`
```python
name = fields.Char('Titre')
description = fields.Html('Description')
start_date = fields.Datetime('Date de début')
end_date = fields.Datetime('Date de fin')
state = fields.Selection(['draft', 'active', 'expired', 'cancelled'])
priority = fields.Selection(['low', 'normal', 'high', 'urgent'])
repeat_display = fields.Boolean('Réafficher périodiquement')
repeat_interval = fields.Integer('Intervalle de répétition')
repeat_unit = fields.Selection(['minutes', 'hours', 'days'])
```

#### `information.campaign.view.history`
```python
campaign_id = fields.Many2one('information.campaign')
user_id = fields.Many2one('res.users')
view_date = fields.Datetime('Date de vue')
```

## 🐛 Dépannage

### Problèmes Courants

#### Le pop-up ne s'affiche pas
1. Vérifiez que la campagne est **Active**
2. Vérifiez les **dates de début/fin**
3. Vérifiez le **ciblage utilisateur**
4. Consultez les logs Odoo pour les erreurs

#### L'intervalle de répétition ne fonctionne pas
1. Vérifiez que **"Réafficher périodiquement"** est coché
2. Vérifiez que l'utilisateur a bien cliqué "J'ai lu"
3. Consultez l'historique des vues

#### Erreurs de permissions
1. Vérifiez que l'utilisateur a le groupe **Administrateur Campagnes**
2. Les utilisateurs normaux n'ont besoin d'aucun droit spécial pour voir les pop-ups

### Logs de Debug
Activez le mode debug et consultez les logs pour :
```
Campaign popup service started
Checking for active campaigns...
Found X campaigns to display
Marking campaign as viewed: ID
```

## 📈 Bonnes Pratiques

### 🎯 Création de Campagnes Efficaces
- **Titre court et explicite** (max 100 caractères)
- **Description claire et concise**
- **Priorité appropriée** (ne pas abuser d'Urgent)
- **Durée adaptée** au contenu

### ⏰ Gestion des Intervalles
- **Informations importantes** : 4-8 heures
- **Rappels de sécurité** : 1-2 fois par jour
- **Alertes urgentes** : 15-30 minutes
- **Annonces ponctuelles** : Une seule fois

### 👥 Ciblage Utilisateurs
- **Informations générales** : Tous les utilisateurs
- **Informations techniques** : Équipe IT
- **Informations RH** : Managers et RH
- **Alertes critiques** : Utilisateurs concernés uniquement

## 📊 Métriques et KPI

### Indicateurs Disponibles
- **Nombre de vues** par campagne
- **Taux de lecture** par utilisateur
- **Temps de réaction** aux campagnes
- **Efficacité par priorité**

### Rapports Recommandés
- Vue mensuelle des campagnes actives
- Analyse de l'engagement utilisateur
- Suivi des campagnes par département

## 🔄 Mises à Jour et Maintenance

### Maintenance Régulière
- **Nettoyage** de l'historique ancien (>6 mois)
- **Archivage** des campagnes expirées
- **Révision** des permissions utilisateur

### Surveillance
- **Logs d'erreur** quotidiens
- **Performance** des pop-ups
- **Retours utilisateur**

## 📞 Support et Contribution

### Version
- **Version actuelle** : 1.0.0
- **Compatible** : Odoo 17.0 CE/EE
- **Statut** : Production Ready

### Historique des Versions
- **v1.0.0** (2025-07-20) : Version initiale
  - Gestion complète des campagnes
  - Système de répétition
  - Interface moderne
  - Groupes de sécurité

### Roadmap Future
- 📱 Support mobile amélioré
- 📧 Notifications email optionnelles
- 📊 Dashboard analytics avancé
- 🌍 Traductions multilingues

---

## 📄 Licence

Ce module est distribué sous licence LGPL-3.

## 👨‍💻 Auteur

**Développé par** : Votre Société  
**Contact** : support@votresociete.com  
**Documentation** : [Wiki du projet]  

---

*Information Campaign v1.0.0 - Module de communication interne pour Odoo 17*
```

Copiez ce contenu et sauvegardez-le dans un fichier nommé `README.md` à la racine de votre module `information_campaign/`. 

Ce README est complet et professionnel, parfait pour documenter votre première version ! 🎉