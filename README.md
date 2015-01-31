# gitevents-mailer

Mailer plugin for [gitevents](https://github.com/GitEvents/gitevents)

Clarifications this document use "we" as a community, however so far, sometime "we" may mean one person, two people or several people, then bear in mind that "we", in the time being, does not mean [GitEvents organisation][https://github.com/GitEvents] which is discussing several aspects and some of them are pushed by one of the members as a start point of a discussion.

__NOTE__: This module is very early stage of development. This README contains several sections which express what it should be, however we encourage people who may interested in [gitevents](https://github.com/GitEvents/gitevents) project to contribute to define the specification, the module's API, etc.

## Contribution

This subsection is the first one because I've already mentioned in the introduction of this document, we encourage people to contribute to discuss the specification and the involved APIs (API module and pluggins APIs).

To contribute to discuss the specification and APIs, go to the specific issue
- [specification](https://github.com/GitEvents/gitevents-mailer/issues/1)
- [Module API](https://github.com/GitEvents/gitevents/issues/45)
- [Mailer API Plugin](https://github.com/GitEvents/gitevents-mailer/issues/2)
- [Renderer API Plugin](https://github.com/GitEvents/gitevents-mailer/issues/3)

## Specification

- Implement a core without lock in to any email provider nor template library which fulfil [gitevents](https://github.com/GitEvents/gitevents) needs.
- Send mass emails to subscribers (e.g. newsletters).
- Support different template engines, we call them renders.
- Support different email providers, we call them mailers; each provider must transform option parameters to the expected format and passing its expected parameters.
- Only offer global and generic email options; any information in the content of the email has to be set in the template with a variable, although they are recommended for example to render on any client or to reduce to get capture by the spam filter, they don't have to be in the modules, that task relies in the person who build the template, not in this module. For this reason the module will be pluggable for:
  - Renders
  - Mailers
- Possibility to use features offered by several providers, for example, email addresses list of the subscribers, etc.
- Keep simple and modular.

We've already know that this specification is challenging, due to keep it simple, modular and independent of providers at the same time to be able to use main email provider's specific features hence bring your idea to the discussion.

## Module API

The module API must fulfil the [gitevents](https://github.com/GitEvents/gitevents) API, so far it's under definiton on [GitEvents/gitevents #45](https://github.com/GitEvents/gitevents/issues/45)

The first approach that we've thought is exporting a function which receive an options object, then it returns something that we have to define if it's a function or an object.

For this module we've thought that options object should have as a required options:
* mailer: The mailer module which implement the [Mailer API plugin](#mailer-api-plugin)
* renderer: The renderer module which implement the [Renderer API plugin](#renderer-api-plugin)

## Mailer API plugin

The first approach that we've thought for the mailer's API is

Any __mailer__ plugin must export a function wich takes an `options {Object}` which contains the parameter that the email provider wrapped by the plugin needs; having an object we don't have to take car if a provider need more options or less than others.

And it __returns an object__ which at least must have `send` method; it could be just a function, but an object has more flexibility to offer more methods if we need in the future, making easy backward compatibility.

For `send` method we've roughly thought to have the next fixed parameters:

1. `from {Object}`: Object with 2 properties:
  * `name {String}`: Name to show.
  * `address {String}`: email address.
2. `to {Array}`: Array of objects with the same 2 properties than `from` object.
3. `cc {Array}`: Same as `to` but for `cc`.
4. `bcc {Array}`: Same as `to` but for `bcc`.
5. `subject {String}`: Message subject.
6. `body {Object}`: Object with 2 properties:
  * `html {String}`: HTML version of the message's body.
  * `text {String}`: Plain text version of the message's body.
7. `options {Object}`: Object with variable properties which allow to user specific features of the provider, however some of them can be common to each mailer but they are not probably used they are not a function parameter, e.g. attachements

Send method may contain some parameters that they aren't often used, however we thought to have as a parameter because they are very common to a email send action; however to avoid the complexity to manage optional parameters moreover that make the code more difficult to understand if there are too many, then we may move them to the `options` object.

## Renderer API plugin

Any __render__ plugin module must export a function which must receive the next parameters:

1. `htmlTemplate {String}`: A string with the HTML version of the template to render.
2. `textTemplate {String}`: A string with the plain text version of the template to render.
3. `locals {Object}`: An object which contains the template variables values to use as default none are needed then `null`.
4. config {Object} (optional)`: An object which may contains specific configurations for the template library. Note they are unlikely compatible between different renderers, hence if you change the renderer then you will have to update it moreover that renderer may ignore this parameters.

  Although __two templates types have to pass as a parameter we may only require one__, then one of them can be null, obviously the result will only contain the provided one.

  And it has to __return__ a `function` which only accepts one parameter:

  1. `data {Object}`: An object which contains the template variable values to use; if one of them is not provided and it has been defined in `locals` then its values will be used.

    This function must __return__ an Object with two properties:
    * `html {String}`: The rendered HTML version of the template or null if HTML version hasn't been provided.
    * `text {String}`: The rendered plain text version of the template or null if plain text version hasn't been provided.

We know that the most of the template engines render templates from files, however to keep the API simple we suggest to only render string templates for two main reasons:

1. Render from file is something we want to do, however reading a file from a disk is something that can be done as standalone tool/util/helper and avoid complexity in renderers implementations and duplicate functionality which should be tested as well. I've also thought that email templates are quite complicated and they have a lot of pain points if they are compatible for at least the most email clients, desktop and browser ones, then keeping them as a single template without partials and layout extension (inheritance), so a single and simple string is enough.
2. Even though to render templates from files seem as a requirement for `gitevents`, we consider that it isn't because the group want to host the template in a public URL (e.g. a Github gist), then the renderer's API should have another function for templates available in an URL, then as I've commented previously the API should be more complex and probably the renders woud have duplicated functionality.

A challenging point here is if with this interface we could implement a renderer which use remote templates hosted by the email provider, for example, using a mailchimp mailer we can implement a specific renderer that allows to the emailer to use its template API, of course mailchimp renderer would only work with mailchimp mailer, however mailchimp mailer must work as any other renderer which is not specific of an email provider.

So far we have an example of a renderer, however it was implemented with the first hackday which we ran on 18/01/2015 and it was a pair programming with a teaching purpose; this document was not available at that moment, for that reason it does not fulfil with the current Renderer API plugin.

You can see `swig` renderer on [gajjargaurav/gitup-mailer-renderer-swig](https://github.com/gajjargaurav/gitup-mailer-renderer-swig)


## Utilities

This section is here to have a thought in common utilities that they are also needed, e.g. read a template from an URL or a file to pass the content to the renderers; however these may be provided by the module itself, hence the approach is under discussion.

## Other plugins

We leave this section to think about to have other kind of plugins to perform required actions which are not defined in any other specified plugin so far but they are required by the [Specification](#specification), e.g access to email addresses list; however they could be in another plugin or in one already defined.

## LICENSE

MIT license, read [LICENSE file](https://raw.githubusercontent.com/ifraixedes/gitevents-mailer/master/LICENSE) for more information.
