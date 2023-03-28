VAULT_VERSION ?= v1.2.2
OPENAPI_YAML := openapi.yaml
GEN_FOLDER := sdk/openapi

CODEGEN_IMAGE := openapitools/openapi-generator-cli:v6.4.0
CODEGEN_CONFIG_FILE := config.yaml

$(GEN_FOLDER)/$(OPENAPI_YAML):
	curl https://piiano.com/docs/$(subst .,-,$(VAULT_VERSION))/assets/openapi.yaml --output $@

###### APP ######
.PHONY: prepare-sdk
prepare-sdk: $(SDK_DIR)/dist/index.js

$(SDK_DIR)/dist/index.js: $(SDK_DIR)/package.json $(SDK_DIR)/openapi.yaml
	yarn --cwd $(SDK_DIR)

.PHONY: prepare-lib
prepare-lib: prepare-sdk $(LIB_DIR)/dist/index.js

$(LIB_DIR)/dist/index.js: $(LIB_DIR)/package.json
	yarn --cwd $(LIB_DIR)

.PHONY: prepare-app
prepare-app: prepare-lib $(APP_DIR)/dist/ormconfig.js

$(APP_DIR)/dist/ormconfig.js: $(APP_DIR)/package.json
	yarn --cwd $(APP_DIR)
	yarn --cwd $(APP_DIR) build

.PHONY: prepare
prepare: prepare-app

.PHONY: stop-prereq
stop-prereq: pvault-stop mongo-stop

.PHONY: app-run
app-run: prepare mongo-run pvault-run
	yarn --cwd $(APP_DIR) start:dev

.PHONY: app-test
app-test: prepare stop-prereq
	yarn --cwd $(APP_DIR) test

###### SDK TYPESCRIPT ######
IN_DOCKER_PWD	:= /local
OPENAPI_YAML	:= $(SDK_DIR)/openapi.yaml

$(SDK_DIR)/generated/index.ts: $(OPENAPI_YAML)
	yarn --cwd $(SDK_DIR) generate

.PHONY: generate-sdk-ts
generate-sdk-ts: $(SDK_DIR)/generated/index.ts