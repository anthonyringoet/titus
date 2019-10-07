# Deploy Titus on AWS Using CircleCI

To set up a Titus deployment on an [AWS] environment using [CircleCI], there are several steps to perform.

The CircleCI configuration lets the team make changes on branches that are then commited to the master. At code freeze,
the team release tag the current master that is also running in the development environment.
This triggers a propagation of the development image to the production and staging environments.


## Set up the EKS Environment

1. Once you have your AWS account, install AWS CLI and configure your AWS profile, [as explained here][taurus-aws-setup].

1. Ensure your management environment is set up as described in the Taurus documnentation. See: [Setup Local Management env][taurus-local-setup]

1. Clone [titus-infra-aws] to a new folder as follows:
   ```sh
   git clone git@github.com:nearform/titus-infra-aws.git
   ```

1. Clone [Taurus] to a new folder as follows:
    ```sh
    git clone git@github.com:nearform/taurus.git
    ```
1. Add a symbolic link to the taurus directory from the titus-infra-aws directory as follows:
   ```sh
   cd titus-infra-aws
   ln -s ../taurus
   ```
1. Create an S3 bucket as described in the Taurus instructions found here: [Create an S3 bucket for terraform state][taurus-state-bucket].

  **Note:** You need to create the bucket only, you do not run the Terraform steps.

1. Edit the `titus-infra-aws/main.tf` file:
    ```yaml
   provider "aws" {
     region     = "eu-west-1" # Set appropriate region
     profile    = "taurus"     # Set same name as your local environment
   }

   terraform {
     backend "s3" {
       bucket  = "titus-taurus-terraform-state" # Change for the name of the bucket you created
       region  = "eu-west-1"                   # Set appropriate region
       ...
     }
   }

   module "taurus" {
     aws_region = "eu-west-1"                  # Set appropriate region
     project_name = "titus-taurus"              # Change according to your project
     ...
   }

   resource "aws_s3_bucket" "b" {
     region = "eu-west-1"         # Set appropriate region
     ...
   }
   ```
1. Initialise Terraform using the command:
  `terraform init`

1. Run the command: `terraform plan` . The output indicates 90+ resources are created.

1. Run the command: `terraform apply` .Type 'yes' when prompted.

1. Install the K8s controller configuration locally (change <name> according to your project) :
   ```sh
     aws eks update-kubeconfig --<name> titus-taurus
   ```


## Customise your Infrastructure

1. Fork the [titus-deploy] repository on GitHub, and clone it using the following command:
   ```sh
      git clone git@github.com:your-name/titus-deploy.git
   ```

1. Edit the file `titus-starter-kit/values.dev.yaml` as follows:
   ```yaml
   env:
     name: "titus-dev"                  # Change according to your project
     host: "titus-preprod.nearform.com" # Provide a DNS host you manage and that has a CNAME in AWS Route53
     ...
   ```

1. Perform similar changes in the file `titus-starter-kit/values.prod.yaml` for your production environment.

1. Commit your changes and push them to your fork.

1. Read through the [titus-secret/README.md](https://github.com/nearform/titus-deploy/tree/master/titus-secrets) provided in the Helm chart as it explains the process of creating and maintaining your secrets. And keep them a secret.

1. Install the secrets Helm chart as follows:
    ```sh
    helm install titus-deploy/titus-secrets/helm-secrets
    ```


# Configure CirclecI

If you have not done previously, fork the [titus] repository, and clone it locally as follows:
```sh
  git clone git@github.com:your-name/titus.git
```

CircleCI accesses and deploys it.

1. On the **CircleCI UI**, add your project by searching the project under **Add Projects**.
  ![circle-add-project]
  Fig 1. Add Project in CircleCI UI

  This adds a deployment key for your repository and sets up the necessary hooks.

  **Note:** You need administrator access to the repository to do this.

1. For CircleCI to access your titus-deploy fork, in CircleCI titus project settings:
  - select **Permissions** > **Checkout SSH keys**
  - select **Add user key**,  and select **Create and add user key**
  - Authenticate with Github (if not done already), and complete the operation

1. Edit the CircleCI project environment variables to add the following:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_DEFAULT_REGION`: AWS region hosting the infrastructure
  - `S3_BUCKET`: name of the S3 bucket in `titus-infra-aws/main.tf`: `aws_s3_bucket.b.name`

  ![circle-env-variables]
  Fig 2. Edit the CircleCI Environment Variables

1. On the **AWS Console**, create as many [ECR repositories][ecr] as the deployed applications need.

1. In the **Titus repo**, update the values in the file `.circleci/config.yaml`:
  - `DOCKER_REPO`: in AWS console, ECR service, use the URI, that is: `123456789.dkr.ecr.eu-west-1.amazonaws.com`
  - `TITUS_DEPLOY_REPO`: add your titus-deploy fork: `git@github.com:your-name/titus-deploy.git`
  - `AWS_ECR_REGION`: AWS region hosting the infrastructure
  - `AWS_EKS_REGION`: AWS region hosting the infrastructure


#### Deploy Your Changes

Commit your changes, push them, and let the magic begin!


[CircleCI]: https://circleci.com
[Taurus]: https://nf-taurus.netlify.com
[taurus-aws-setup]: https://nf-taurus.netlify.com/#/setup-local/?id=for-aws
[taurus-local-setup]: https://nf-taurus.netlify.com/#/setup-local/?id=install-dependencies
[taurus-state-bucket]: https://nf-taurus.netlify.com/#/providers/aws/?id=create-an-s3-bucket-for-terraform-state
[titus-infra-aws]: https://github.com/nearform/titus-infra-aws
[titus-deploy]: https://github.com/nearform/titus-deploy
[titus]: https://github.com/nearform/titus
[Terraform]: https://www.terraform.io
[Azure]: https://azure.microsoft.com
[AWS]: https://aws.amazon.com
[Helm]: https://helm.sh
[Kubernetes]: https://kubernetes.io
[ecr]: https://eu-west-1.console.aws.amazon.com/ecr/repositories

[circle-add-project]: ../../img/circle-add-project.png
[circle-env-variables]: ../../img/circle-env-variables.png