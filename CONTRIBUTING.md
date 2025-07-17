*This is not an officially supported Google product*

# How to contribute

We'd love to accept your patches and contributions to this project.

## Before you begin

### Sign our Contributor License Agreement

Contributions to this project must be accompanied by a
[Contributor License Agreement](https://cla.developers.google.com/about) (CLA).
You (or your employer) retain the copyright to your contribution; this simply
gives us permission to use and redistribute your contributions as part of the
project.

If you or your current employer have already signed the Google CLA (even if it
was for a different project), you probably don't need to do it again.

Visit <https://cla.developers.google.com/> to see your current agreements or to
sign a new one.

### Review our community guidelines

This project follows
[Google's Open Source Community Guidelines](https://opensource.google/conduct/).

## Contribution process

First off, thank you for considering contributing! This guide will walk you through the process of setting up your environment and submitting your changes.
This is a monorepo containing many individual demos. We recommend using Git's sparse checkout feature to download only the files for the specific demo you wish to work on.

### 1. Set Up Your Repository with Sparse Checkout
This process allows you to clone the repository structure without downloading every single file. You then specify which demo(s) you need.
```
# 1. Clone the repository without checking out any files yet
git clone --filter=blob:none --no-checkout https://github.com/privacysandbox/privacy-sandbox-web-playbook.git

# 2. Navigate into the new directory
cd privacy-sandbox-web-playbook

# 3. Initialize sparse checkout and tell Git which demo you want.
#    Replace <path/to/your-demo> with the actual path.
#    For example: fedcm/fedcm-rp-demo
git sparse-checkout set '<path/to/your-demo>'

# Tip: To work on another demo later, you can add it like this:
# git sparse-checkout add '<path/to/another-demo>'
```
### 2. Create Your Branch
Create a new branch for your changes. Please use a descriptive name.

```
git checkout -b <your-branch-name>
```
### 3. Make Your Changes & Run Local Checks
This repository uses automated checks to ensure alignment with the open source development requirements. You must install the pre-commit hooks to test your changes locally before you commit.

**One-Time Setup:**
```
# 1. Install the pre-commit framework (requires Python/pip)
pip install pre-commit

# 2. Install the hooks into your local .git directory
pre-commit install
```
Now, every time you run git commit, the checks will run automatically on your staged files. If a check fails, the commit will be aborted, allowing you to fix the issue.

#### Contribution Requirements Checklist
To ensure your pull request can be merged, please make sure your contribution adheres to the following requirements. The pre-commit hooks will help you with this automatically.
* ✅ License Header: Every source file (e.g., .js, .py, .html, .css, .wat) must begin with the standard Apache License header.
* ✅ Disclaimer Header: Every source file must also contain the disclaimer: This is not an officially supported Google product.
* ✅ Demo README.md: The top-level directory of your demo must contain a README.md file explaining what the demo is and how to run it. This file should only contain the disclaimer, not the full Apache license header.
* ✅ Demo CONTRIBUTING.md: The top-level directory of your demo must contain a CONTRIBUTING.md file.
* ✅ Demo LICENSE: The top-level directory of your demo must contain a LICENSE file (a copy of the main Apache License).

### 5. Open a Pull Request
Go to the repository on GitHub and open a new pull request from your branch to the main branch. Provide a clear title and description of the changes you've made.

## Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.
