---
title: "Docker image build,push,run"
date: 2024-05-21
description: "수동 배포"
source: medium
original: "https://medium.com/@sj.youns1027/docker-image-4698a74ca471"
---
1. Image build 하기

```
$ docker build -t image-name .
```

**-t **또는** — tag** : 이미지의 이름과 태그를 지정합니다.

마지막에 **. 을 사용하여 해당 경로에서 dockerfile을 찾아야 한다고 알려줍니다.**

**2. Listing images**

```
docker images
```

image 들의 list를 보여줍니다.

3. Pushing images to a registry

```
docker push image-name:your-tag
```

4. run

```
docker run -it -p 1234:8080 image-ID
```

=> local 1234 port로 가면 접속할 수 있음.

## Docker image build 후 Google Cloud Platform Artifact Registry에 push 하기.

로컬 이미지를 표준 Docker 저장소로 push하려면 저장소 이름으로 태그를 지정한 후 이미지를 push해야한다.

1. **docker image build**

```
docker build -t football-quiz-test-image .
```

**2. 생성된 image 확인**

```
docker images
```

명령어를 입력하면 아래처럼 repository에 저장된 image들을 확인할 수 있다. football-quiz-test-image 이름으로 된 image(image id: 559754e4c3c1)가 생성되었다.

```
REPOSITORY                                                                                           TAG       IMAGE ID       CREATED          SIZE
football-quiz-test-image                                                                             latest    559754e4c3c1   4 minutes ago    365MB
asia-northeast3-docker.pkg.dev/football-quiz-project/cloud-run-source-deploy/test                    <none>    2f183ddabd99   51 minutes ago   365MB
...
```

**3. 저장소 이름으로 로컬 이미지에 태그를 지정**

![](/images/medium/4698a74ca471/1.png)

```
docker tag 559754e4c3c1 asia-northeast3-docker.pkg.dev/football-quiz-project/cloud-run-source-deploy/football-quiz-project:latest
```

**4. 태그가 지정된 이미지를 Artifact Registry로 내보낸다.**

![](/images/medium/4698a74ca471/2.png)

```
docker push asia-northeast3-docker.pkg.dev/football-quiz-project/cloud-run-source-deploy/football-quiz-project:latest
```

### [확인]

GCP의 Artifact Registry에 접속

![](/images/medium/4698a74ca471/3.png)

cloud-run-source-deploy를 클릭하면 football-quiz-project 저장소를 볼 수 있다.

![](/images/medium/4698a74ca471/4.png)

저장소 내부에 push 해준 이미지가 저장되있음을 확인할 수 있다.

![](/images/medium/4698a74ca471/5.png)

저장된 이미지를 클릭하면 배포할 수 있다.

![](/images/medium/4698a74ca471/6.png)
