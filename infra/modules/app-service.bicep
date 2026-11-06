param appName string
param appServicePlanId string
param location string
param tags object

@secure()
@minLength(1)
param foundryProjectEndpoint string

module webApp 'br/public:avm/res/web/site:0.24.0' = {
  name: 'webApp'
  params: {
    basicPublishingCredentialsPolicies: [
      {
        allow: false
        name: 'scm'
      }
      {
        allow: false
        name: 'ftp'
      }
    ]
    enableTelemetry: false
    httpsOnly: true
    kind: 'app,linux'
    location: location
    managedIdentities: {
      systemAssigned: true
    }
    name: appName
    serverFarmResourceId: appServicePlanId
    siteConfig: {
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      linuxFxVersion: 'NODE|24-lts'
      minTlsVersion: '1.2'
    }
    tags: tags
  }
}

resource existingWebApp 'Microsoft.Web/sites@2024-11-01' existing = {
  name: appName
}

resource appSettings 'Microsoft.Web/sites/config@2024-11-01' = {
  parent: existingWebApp
  name: 'appsettings'
  properties: {
    FOUNDRY_PROJECT_ENDPOINT: foundryProjectEndpoint
    FOUNDRY_AGENT_NAME: 'Proyecto-final-etapa-2'
    SCM_DO_BUILD_DURING_DEPLOYMENT: 'true'
    ENABLE_ORYX_BUILD: 'true'
    ORYX_DISABLE_COMPRESSION: 'true'
    WEBSITES_CONTAINER_START_TIME_LIMIT: '1800'
  }
  dependsOn: [
    webApp
  ]
}
