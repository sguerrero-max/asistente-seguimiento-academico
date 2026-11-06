targetScope = 'subscription'

param subscriptionId string
param resourceGroupName string
param location string
param appName string
param appServicePlanName string
param sessionId string
param environmentName string
param deployedBy string
param createdAt string

@secure()
@minLength(1)
param foundryProjectEndpoint string

var tags = {
  'app-onboard-skill': 'true'
  'app-onboard-session-id': sessionId
  'created-at': createdAt
  environment: environmentName
  'deployed-by': deployedBy
}

resource existingResourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' existing = {
  name: resourceGroupName
  scope: subscription(subscriptionId)
}

module appService './modules/app-service.bicep' = {
  name: 'appService-${uniqueString(subscriptionId, resourceGroupName, appName)}'
  scope: existingResourceGroup
  params: {
    appName: appName
    appServicePlanId: resourceId(subscriptionId, resourceGroupName, 'Microsoft.Web/serverfarms', appServicePlanName)
    foundryProjectEndpoint: foundryProjectEndpoint
    location: location
    tags: tags
  }
}
