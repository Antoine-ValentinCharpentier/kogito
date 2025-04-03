# Modeler BPMN / DMN pour Kogito

## 1. Présentation du projet

Ce projet permet de créer et de manipuler des diagrammes **BPMN** (Business Process Model and Notation) et **DMN** (Decision Model and Notation) dans une application web en utilisant les éditeurs **standalone** de Kogito. Ces éditeurs sont fournis par la bibliothèque [@kogito-tooling/kie-editors-standalone](https://www.npmjs.com/package/@kogito-tooling/kie-editors-standalone).

Vous pouvez :
- **Visualiser** un diagramme BPMN/DMN
- **Créer** un diagramme BPMN ou DMN.
- **Upload** un fichier BPMN/DMN existant.
- **Download** le modèle modifié sous forme de fichier.
- Utiliser des fonctions de **Undo** et **Redo** pour revenir en arrière ou refaire des actions dans l'éditeur.

Le projet est conçu pour fonctionner dans un environnement React.

## 2. Prérequis

Avant de commencer à utiliser l'application, vous devez vous assurer que vous avez les prérequis suivants installés sur votre machine :

- **Node.js** 
- **npm**

## 3. Installation

1. **Cloner le projet** :
   cloner le projet

   ```bash
   git clone ...
   cd ...
   ```
    Ouvrez un terminal et naviguez jusqu'au répertoire du projet. 

2. **Installer les dépendances** :
   
   Exécutez ensuite la commande pour installer les dépendances :

   ```bash
   npm install
   ```

## 4. Utilisation

### Démarrer le projet

Vous pouvez démarrer l'application en mode développement en exécutant la commande suivante :

```bash
npm run start
```

Cela ouvrira l'application dans votre navigateur par défaut à l'adresse [http://localhost:3000](http://localhost:3000).

### Fonctionnalités

1. **Sélectionner le type d'éditeur** :
   Vous pouvez choisir entre **BPMN** et **DMN** en utilisant un menu déroulant situé en haut de l'application.

2. **Télécharger un fichier** :
   Vous pouvez télécharger le contenu du diagramme courant en cliquant sur le bouton "Download the BPMN" ou "Download the DMN".

3. **Charger un fichier** :
   Cliquez sur le bouton "Choose File" pour charger un fichier BPMN/DMN existant. L'application détectera automatiquement l'extension du fichier et l'ouvrira dans l'éditeur correspondant.

4. **Undo / Redo** :
   Les boutons **Undo** et **Redo** permettent de revenir en arrière ou de refaire des actions dans l'éditeur.

## 5. Remarques

Ce projet a été conçu en **un temps très court**, principalement pour tester un modeler et de le comparer à l'extension VSCode proposé par Kogito.

De nombreuses améliorations sont possibles:
- Rendre l'IHM plus attractive visuellement
- Amélioration de la propreté du code
- Gestion d'erreurs