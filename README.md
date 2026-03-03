
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

# En cas de non prise en compte en ligne 
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
