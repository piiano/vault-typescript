<p>
  <a href="https://piiano.com/pii-data-privacy-vault/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://docs.piiano.com/img/logo-developers-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://docs.piiano.com/img/logo-developers.svg">
      <img alt="Piiano Vault" src="https://docs.piiano.com/img/logo-developers.svg" height="40" />
    </picture>
  </a>
</p>

# Piiano Vault Typescript SDK

This SDK contains:

1. [Vault Client](./vault-client) - a client that connects to Vault and enables the use of resources from the Vault REST API.
1. [Vault Encryption with TypeORM](./typeorm-encryption) - a package for encrypting and decrypting TypeORM fields.
1. [Vault PCI HTML Forms](./forms) - HTML forms that process sensitive data without exposing it to your systems by tokenizing the data before submitting it to your backend. A typical use case is for processing credit card numbers while remaining out of PCI scope.
1. [Vault PCI React Forms](./react-forms) - React forms that process sensitive data without exposing it to your systems by tokenizing the data before submitting it to your backend. A typical use case is for processing credit card numbers while remaining out of PCI scope.
1. [Vault Bundles](./vault-bundles) - Type definitions for creating and using [Vault Bundles](https://docs.piiano.com/guides/reference/bundles).
