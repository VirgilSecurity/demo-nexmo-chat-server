.PHONY: docker
docker: build_docker

IMAGENAME=virgil-demo-nexmo-server
DOCKER_REGISTRY=virgilsecurity

define tag_docker
  @if [ "$(GIT_TAG)" != "" ]; then \
	  docker tag $(IMAGENAME) $(DOCKER_REGISTRY)/$(IMAGENAME):$(GIT_TAG); \
	  docker tag $(IMAGENAME) $(DOCKER_REGISTRY)/$(IMAGENAME):latest; \
  else \
    docker tag $(IMAGENAME) $(DOCKER_REGISTRY)/$(IMAGENAME):$(GIT_BRANCH); \
  fi
endef

define push_docker
  @if [ "$(GIT_TAG)" != "" ]; then \
		docker tag $(IMAGENAME) $(DOCKER_REGISTRY)/$(IMAGENAME):latest; \
    docker push $(DOCKER_REGISTRY)/$(IMAGENAME):$(GIT_TAG); \
  else \
    docker push $(DOCKER_REGISTRY)/$(IMAGENAME):$(GIT_BRANCH); \
  fi
endef

build_docker:
	docker build -t $(IMAGENAME) --build-arg git_commit=$(GIT_COMMIT) .

docker_registry_tag:
	$(call tag_docker)

docker_registry_push:
	$(call push_docker)

docker_inspect:
	docker inspect -f '{{index .ContainerConfig.Labels "git-commit"}}' $(IMAGENAME)
	docker inspect -f '{{index .ContainerConfig.Labels "git-branch"}}' $(IMAGENAME)
