# Introduction

Kogito est une plateforme open-source développée par Red Hat, qui permet de concevoir et d'exécuter des systèmes de gestion de processus métier (BPM) et de règles métiers (DMN). Elle repose sur les technologies : jBPM (moteur de workflow), Drools (logiciel qui gèrent les règles métier). 
Elle se distingue par son approche cloud-native, intégrée avec des outils comme Kubernetes et OpenShift pour une orchestration et une mise à l’échelle efficaces.
Les principales briques de Kogito sont :
•	Kogito Job Services : Gère l'exécution des tâches planifiées et asynchrones
•	Kogito Management Console : une interface utilisateur permettant aux administrateurs de gérer, monitorer et contrôler l'exécution des processus métiers en temps réel (Equivalent à Operate).
•	Kogito Task Console : un tableau de bord pour les utilisateurs finaux, permettant de visualiser et d’interagir avec les tâches assignées dans les processus métiers (Equivalent à Tasklist).
•	Kogito Data Index : un service qui indexe et permet de rechercher les données liées aux processus, aux décisions et aux tâches. Les données sont issus de Kafka et Infinispan
o	Kafka : utilisé pour la gestion des événements
o	Infinispan : Stocke les données fréquemment accédées
•	SSO (Single Sign-On) : pour l'authentification unifiée 
•	Explainability : une fonctionnalité visant à offrir une transparence dans les décisions prises par les systèmes automatisés, en permettant de comprendre les critères et processus utilisés pour parvenir à un résultat.

Aucun de ces composants n'est indispensable pour que les services de Kogito fonctionnent. Ces derniers embarquent tout le nécessaire pour fonctionner de manière autonome, sans dépendre d'autres éléments. Ces composants supplémentaires facilitent simplement l'exploitation et l'optimisation des processus.
Kogito se distingue également par son moteur embarqué, intégrant directement le moteur de workflow aux job workers. Cette approche permet une exécution plus rapide et plus efficace des processus, en réduisant la latence et en améliorant la réactivité des applications.
Je vais ici vous présenter mon retour d'expérience et mes tests, sur le déploiement et la migration de C7 vers Kogito, tout en évoquant les difficultés que j'ai rencontrées.

//TODO : sommaire

# Déploiement
## Sur OpenShift
Étant donné que Kogito a été conçu pour fonctionner nativement sur OpenShift (une plateforme également développée par Red Hat) il m’a semblé naturel d’envisager en priorité son déploiement sur un cluster OpenShift. Cette orientation est d’ailleurs soutenue par la documentation officielle, qui décrit la procédure d’installation.
Pour faciliter le déploiement, Kogito fournit deux outils (dont les liens ne sont malheureusement plus à jour dans la documentation, mais que je les ai retrouvés) :
-	Kogito Operator, qui permet la gestion automatisée des composants Kogito sur OpenShift : https://github.com/apache/incubator-kie-kogito-operator/releases/download/v1.44.1/kogito-operator.yaml
-	Kogito CLI, un outil en ligne de commande permettant d’interagir plus facilement avec l’Operator : https://github.com/apache/incubator-kie-kogito-operator/releases/download/v1.44.1/kogito-cli-1.44.1-linux-amd64.tar.gz
Ces méthodes permettent de déployer les services Kogito sous forme de pods OpenShift, qui peuvent être mis à l'échelle individuellement et gérés à l'aide des méthodes standard d'OpenShift.
Pour installer le Kogito CLI, il suffit de le télécharger via le lien mentionné précédemment et de l’ajouter au PATH de votre machine.
Le Kogito Operator quant à lui peut être déployé de plusieurs manières :
-	A l’aide de OperatorHub
-	A l’aide de OC cli
J’ai rapidement écarté la première option, tout simplement parce que je n’y avait pas accès sur InnerShift : des permissions administrateur sont requises. Je me suis donc concentré sur la deuxième approche.
Afin de ne pas être limité par ces restrictions de permissions, j’ai migré mes tentatives  d’installation sur un cluster local basé sur Kind (Kubernetes in Docker).

En essayant d’installer le Kogito Operator en ligne de commande, deux éléments importants sont apparus :
-	Le lien vers le fichier YAML de déploiement n’est pas à jour dans la documentation officielle. Le dépôt GitHub a changé, et il faut donc utiliser la commande suivante : kubectl apply -f "https://github.com/apache/incubator-kie-kogito-operator/releases/download/v1.44.1/kogito-operator.yaml"
-	Cette commande crée un nouveau namespace automatiquement avec l’Operator, ce qui est problématique : on souhaite garder le contrôle sur les ressources créées. Pour résoudre cela, il faut récupérer et modifier le fichier YAML afin de remplacer la mention du namespace par le nom de votre namespace souhaité.
À ce stade, j’étais satisfait : je pensais enfin être prêt à installer les différentes briques de Kogito !
Après avoir déployé le Kogito Operator et installé le CLI kogito, j’ai suivi les instructions de la documentation pour installer les composants nécessaires à l’écosystème Kogito, notamment Kafka et Infinispan, indispensables au fonctionnement du Data Index, qui est utilisé à son tours par d’autres briques.
Il vous faudra commencer par sélectionner le namespace cible avec :
-	kogito use-project NAMESPACE_NAME
Puis on installe les infrastructures kafka et infinispan à l’aide des commandes suivante d’après la documentation :
-	kogito install infra kogito-infinispan-infra --kind Infinispan --apiVersion infinispan.org/v1 --resource-name kogito-infinispa
-	kogito install infra kogito-kafka-infra --kind Kafka --apiVersion kafka.strimzi.io/v1beta2 --resource-name kogito-kafka
L’outil semblait indiquer que les ressources avaient été créées avec succès. Pourtant, aucune ressource n’était visible dans le cluster : pas de namespace, pas de pods, pas de deployments, ni de statefulsets…
Après avoir activé le mode verbose du CLI, j’ai constaté que kogito-cli ne parvenait pas à localiser les opérateurs requis (Kafka et Infinispan). En réalité, le CLI s’attend à ce que ces opérateurs soient déjà installés dans le cluster, ce qui n’était pas le cas.
J’ai donc dû les installer moi-même, ce qui s’est révélé fastidieux, car cela implique plusieurs étapes, notamment la création de namespaces, de CRDs, etc..
-	Pour Kafka : kubectl create -f “https://strimzi.io/install/latest?namespace=NAMESPACE_NAME “ -n NAMESPACE_NAME
-	Pour Infinispan : Se référer à la section « 3.2. Installing Infinispan Operator with the native CLI plugin“ du site https://infinispan.org/docs/infinispan-operator/main/operator.html
  -	 Cela demande plusieurs opérations :
    -	Installer le plugins kubectl dédié à infinispan (Voir 2.1. Installing the native Infinispan CLI plugin)
    -	Active les OLM
    -	…
   	
Une fois ces opérateurs installés, j’ai retesté les commandes d’installation via kogito-cli. Et, grande surprise : il ne détectait toujours pas les opérateurs pourtant présents dans le cluster. Résultat : l’infrastructure Kafka et Infinispan ne pouvait pas être créée, bloquant ainsi le fonctionnement du Data Index.
J’ai tout de même testé l’installation du data-index, celle-ci s’est bien déroulée mais j’obtenais, sans surprise, des logs indiquant qu’il n’arrivait pas à établir la communication avec le Kafka et l’Infinispan. Je me suis dit que j’allais essayer de faire une installation du Kafka et de l’Infinispan sans opérateur, sans utiliser le Kogito CLI, mais cela reste un problème car, lors de l’installation du data-index, il demande des noms de ressources et non une URL ! Donc compliqué d’établir la connexion ! Il semblerait que toute l’installation doive s’effectuer par l’intermédiaire du Kogito Operator…
Face à ces difficultés, j’ai cherché une alternative via Helm. Un repository de chartes Helm pour Kogito a bien été trouvé, mais il n’avait pas été mis à jour depuis plus de 4 ans, ce qui rend son usage peu fiable : https://github.com/kiegroup/kogito-helm-charts

Compte tenu de ces constats, si l'on souhaite intégrer Kogito facilement dans un environnement comme OpenShift, la solution la plus stable semble être de partir d’un Docker Compose existant et de le convertir en charte Helm personnalisée. Des outils comme Kompose (https://kompose.io/) permettent de faciliter cette conversion et offriraient un meilleur contrôle sur le déploiement des différentes briques que des passer via le kogito operator, tout en respectant les contraintes de l’environnement cible.
Je trouve que l’installation de Kogito sur OpenShift est bien plus compliquée que celle de Camunda sur cette même plateforme. D’autant plus que la documentation de Kogito n’est pas à jour, ce qui demande de rechercher l’information un peu partout, complexifiant ainsi son installation. De plus, Il faut trouver constamment des solutions pour avoir un plus grand contrôle sur les ressources demandées pour installer les différentes ressources où que l’on le souhaite, sans devoir avoir des permissions plus élevées…

## Sur Docker-Compose

//TODO : Copie Github

### Conenct a Kogito service to infra

L’installation peut ne pas être entièrement exacte. Je n’ai pas réussis a l’utiliser avec des services Kogito, pour confirmer son fonctionnement.
Plus exactement, j’arrive a accéder aux différentes interfaces, mais ces dernière sont vide. Après investigations, il semblerait que les services que j’ai utilisés n’exportent les données dans le data-index, endroit où les interfaces de management et de tâches pioches leur données. Ainsi, le problème viendrait des services qui se plug à l’infrastructure et non un problème dans l’infrastructure.
Sur internet, il y a beaucoup d’examples de services qui fonctionne sans export des données et j’en ai trouvé seulement deux répo github avec export, ce qui complexifie la tâche de vérification du fonctionnement.
J’ai testé d’activé la persistance des données dans le services, chose qiu a fonctionné, mais cela n’a pas de lien avec les données du data-index. Cela permet au cas où l’application redémarre, d’avoir encore les données de fonctionnement. Les diagrammes ne sont pas exporté par exemple lors de la persistance.
La documentation indique d’ajouter dans le pom.xml la dépendance suivante : 
<dependencies>
  <dependency>
    <groupId>org.kie.kogito</groupId>
    <artifactId>kogito-addons-quarkus-data-index-infinispan</artifactId>
  </dependency>
</dependencies>
kogito examples
Et de renseigner dans le application.properties : 
kogito.dataindex.http.url=http://HOST:PORT/graphql
spring.kafka.bootstrap-servers=localhost:9092

# Modéliser un diagramme
Il est possible de modéliser des BPMN/DMN Kogito de trois manières :
-	Via une extension à installer sur VSCode : Cette méthode peut parfois entraîner des bugs visuels, principalement dus aux extensions de VSCode.
//TODO: logo VS code
-	En intégrant le modeler dans une application web à l’aide d’une bibliothèque npm. La bibliothèque https://www.npmjs.com/package/@kogito-tooling/kie-editors-standalone permet d’ajouter facilement le modeler dans une application web. J'ai eu l'occasion de la tester en créant rapidement une interface pour tester cette bibliothèque et vérifier si l'interface différait. Le code est disponible à l'adresse suivante : //TODO
-	Une version en ligne était disponible auparavant, mais elle est désormais hors service.

# Migration
Kogito utilise un moteur BPMN différent de celui de Camunda. Ainsi, si vous tentez de copier-coller directement vos modèles BPMN issus de Camunda dans Kogito, ces derniers ne fonctionneront pas immédiatement. Cela est dû au fait que, bien que les deux moteurs respectent la norme BPMN 2.0, leurs implémentations respectives différe et apportent leurs particularités. Pour plus d'informations à ce sujet, veuillez consulter la page //TODO sur Confluence. Ainsi, un re-développement des BPMNs est à envisager…

Nous allons dans cette section, voir les modifications à adopter pour les tâches les plus utiliser dans les BPMN.

//TODO : copier coller mes notes

Il est également important de noter que mes tests se sont arrêtés à ce stade, car les autres types de tâches (comme les Script Task, Call Activity, Message, etc.), sont étroitement liés au BPMN. En effet, tester ces tâches, m’aurait soulevé la même problématique que j’ai rencontré avec ces les autres tâches, qui est lié à la différence de moteur, à savoir la perte des propriétés des tâches. Cette question est également expliquée dans la page //TODO sur Confluence.

# Conclusion

Bien que Kogito soit géré par RedHat, le déploiement des outils associés à Kogito se révèle plus complexe que celui de Camunda. 
Mais malheureusement, la complexité ne se limite pas uniquement au déploiement. La migration des processus nécessite un effort considérable, car Kogito utilise un moteur BPMN différent de celui de Camunda. Par conséquent, il est souvent plus rapide et plus simple de recréer les BPMN à partir de zéro plutôt que d'essayer de migrer l'existant.
Il est important de noter que Camunda 7 propose plusieurs méthodes de déploiement, que ce soit avec un Zeebe centralisé ou décentralisé. Cette diversité d'architectures peut constituer un frein lors de la migration vers Kogito, qui dispose uniquement d’un moteur embarqué avec ses services. Ce choix a également un impact sur la migration des "service tasks" de Camunda. Alors que ceux-ci peuvent se connecter à un Zeebe existant, Kogito exige que tous les services soient intégrés simultanément, ce qui complique la transition.
De ce fait, un projet C7 conçu actuellement avec un moteur embarqué et des service tasks de type classe Java sera plus facile à migrer qu’un C7 utilisant un Zeebe centralisé avec des job workers externes, car il sera nécessaire de tout regrouper ensemble, ce qui peut alourdir la taille des projets
Un autre point crucial est que Kogito semble davantage orienté vers Quarkus que vers Spring Boot, ce qui ralentit l’identification de solutions adaptées aux projets utilisant ce dernier framework. La documentation et les exemples fournis par la communauté sont en grande partie centrés sur Quarkus, ce qui accentue la difficulté pour les projets basés sur Spring Boot.
De plus, la communauté Kogito est encore relativement réduite par rapport à celle de Camunda, rendant la recherche de solutions à certains problèmes plus complexe. Les ressources disponibles, notamment la documentation, ne sont pas toujours à jour et sont souvent davantage axées sur des cas d’utilisation avec Quarkus, renforçant ainsi les défis rencontrés par les développeurs Spring Boot.

# Liens
- Documentation : https://docs.kogito.kie.org/latest/html_single/
- Examples de services : https://github.com/kiegroup/kogito-examples
- Example de service avec Management console :
  - https://github.com/chakerfezai/kogito-order-fulfillment

