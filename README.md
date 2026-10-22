
## Description du Projet : Application de la jeunesse

L'application permet de gerer les associations 

## Installation

```bash
$ npm install
```

## Lancer l'application

```bash
# development
$ npm run start

# production mode
$ npm run start:prod

#Commande pour generer un JWT_SECRET
$ node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

```
## Référentiels

Les nomenclatures (types d’association, public cible, etc.) ont deux accès distincts :

- **Formulaire public et dossiers** : lecture des valeurs **actives**, sans connexion (`GET /api/referentiels`).
- **Administration** (`/referentiels`) : uniquement les comptes qui **configurent** la plateforme (`LIST_REFERENTIEL`, `CREATE_REFERENTIEL`, `UPDATE_REFERENTIEL`, `DELETE_REFERENTIEL`). Par défaut : l’administrateur. L’instructeur et le validateur n’ont pas ce menu : ils voient les listes dans les formulaires de dossier.

## Lancer les migrations

```bash
# Initialisation de la migration
$ npx prisma migrate dev --name init

# Regenerer les tables (apres modification des tables )
$ npx prisma generate 

# Mettre à plat la base de données
$ npx prisma migrate reset

# Prise en compte des seeder
$ npm run seed
```

# En production, ne pas utiliser `db push` : déployer les migrations
$ npx prisma migrate deploy

## Lancer les tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```


## Comptes par défaut (seed)

Mot de passe commun : `Admin@Jeunesse2026`  
(surcharge possible via `DEFAULT_ADMIN_EMAIL` et `DEFAULT_ADMIN_PASSWORD` dans `.env`)

| Rôle | E-mail | Accès typiques |
| --- | --- | --- |
| Administrateur | `admin@jeunesse.ga` | Plateforme : comptes, connexions, utilisateurs, rôles, **nomenclatures** |
| Instructeur | `instructeur@jeunesse.ga` | Instruction des dossiers (sans validation) |
| Validateur | `validateur@jeunesse.ga` | Validation, publication, indicateurs plus larges |
| Directeur général | `dg@jeunesse.ga` | Pilotage et aide à la décision |

Ces comptes sont des exemples : les rôles sont dynamiques, la différence se fait par les permissions (y compris les blocs du tableau de bord). Se reconnecter après un seed pour recharger les habilitations.

## Docker (VPS Linux / Hostinger)

Les images sont construites pour **linux/amd64** (serveur Hostinger). Depuis macOS ou Windows, Docker Desktop + buildx produit la même image Linux.

**Liens publics (domaine, front, API, CORS)** : un seul fichier YAML, pas de domaine en dur dans le code.

```bash
cp config/app.yaml.example config/app.yaml
# renseigner : domain: votredomaine.tld
sudo mkdir -p /etc/jeunesse
sudo cp config/app.yaml /etc/jeunesse/app.yaml
```

Changer de domaine plus tard = éditer `/etc/jeunesse/app.yaml` puis relancer les conteneurs (pas de rebuild).

**Installation VPS** (en root, une fois le SSH possible) :

```bash
sudo bash scripts/provision-vps.sh votredomaine.tld
```

Cela installe Docker, Compose, Nginx, Certbot, Jenkins, crée `/etc/jeunesse/app.yaml` et le reverse proxy `80 → 127.0.0.1:8080` (front) / `4000` (API).

**Sécurité — à faire immédiatement :** l’ancien Jenkinsfile versionnait `DATABASE_URL`, `JWT_SECRET` et les identifiants mail. Ces secrets sont maintenant retirés du dépôt. **Les faire tourner** (nouveau mot de passe PostgreSQL, nouveau `JWT_SECRET`, nouveaux identifiants SMTP) puis les placer uniquement dans Jenkins (Secret file `jeunesse-api-env`). Ne jamais versionner le mot de passe root ni celui de Jenkins.

### Build local

```bash
cp .env.production.example .env   # puis renseigner les vraies valeurs
docker buildx create --use --name jeunesse-builder 2>/dev/null || true
npm run docker:build              # linux/amd64 chargé dans Docker local
# ou les deux architectures :
# npm run docker:build:multi
docker compose up -d
curl -s http://127.0.0.1:4000/api/health
```

PostgreSQL est en général sur l’hôte : dans `.env` utiliser `host.docker.internal` (pas `localhost`, qui pointerait vers le conteneur). PostgreSQL doit écouter sur l’interface Docker (`listen_addresses`) et autoriser le pont `172.16.0.0/12` dans `pg_hba.conf`.

Le conteneur n’écoute que sur **127.0.0.1:4000**. Nginx/Caddy de l’hôte termine le TLS :

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_hide_header X-Powered-By;
}
```

### Jenkins

1. Installer Docker + plugin **Docker Pipeline** ; l’utilisateur `jenkins` doit appartenir au groupe `docker`.
2. Credentials :
   - `github-backend-key` (SSH)
   - `jeunesse-api-env` (Secret file, modèle `.env.production.example`, `APP_STATUS=PROD`)
3. Job Pipeline branch `main`, script `Jenkinsfile`.
4. Pare-feu VPS : ouvrir seulement 80/443. Ne pas publier 4000 publiquement.
