# gitevents-mailer

Mailer plugin for [gitevents](https://github.com/GitEvents/gitevents)

Clarifications this document use "we" as a community, however so far, sometime "we" may mean one person, two people or several people, then bear in mind that "we", in the time being, does not mean [GitEvents organisation](https://github.com/GitEvents) which is discussing several aspects and some of them are pushed by one of the members as a start point of a discussion.

__NOTE__: This module is very early stage of development. This README contains several sections which express what it should be, however we encourage people who may interested in [gitevents](https://github.com/GitEvents/gitevents) project to contribute to define the specification, the module's API, etc.

## Contribution

This subsection is the first one because I've already mentioned in the introduction of this document, we encourage people to contribute to discuss the specification and the involved APIs (API module and pluggins APIs).

To contribute to discuss the specification and APIs, go to the specific issue
- [specification](https://github.com/GitEvents/gitevents-mailer/issues/1)
- [Module API](https://github.com/GitEvents/gitevents/issues/45)
- [Mailer API Plugin](https://github.com/GitEvents/gitevents-mailer/issues/2)
- [Renderer API Plugin](https://github.com/GitEvents/gitevents-mailer/issues/3)

## Specification

- Implement a core without lock in any specific email provider nor template library which fulfil [gitevents](https://github.com/gitevents/gitevents) needs.
- Send mass emails to subscribers (e.g. newsletters).
- Support different template engines, we call them renderers.
- Support different email providers, we call them providers; each provider must transform option parameters to the expected format and passing its expected parameters.
- Only offer global and generic email options; any information in the content of the email has to be set in the template with a variable, although they are recommended for example to render on any client or to reduce to get capture by the spam filter, they don't have to be in the modules, that task relies in the person who build the template, not in this module. For this reason the module will be pluggable for:
  - Renderers
  - Providers
- Possibility to use features offered by several providers, for example, email addresses list of the subscribers, etc.
- Keep simple and modular.

We've already know that this specification is challenging, due to keep it simple, modular and independent of providers at the same time to be able to use main email provider's specific features hence bring your idea to the discussion.

## Module API

The module API must fulfil the [gitevents](https://github.com/gitevents/gitevents) API, so far it's under definiton on [GitEvents/gitevents #45](https://github.com/GitEvents/gitevents/issues/45)

The first approach that we've thought is exporting a function which receive an options object, then it returns and object with the methods that the plugin expose.

The exported object is a setup mailer that allows to send emails with the base configuration, it means that the emails will always be equal with the only exception of the receivers (`to` address list) and the data to use to render the content of the email. If you have to send an email with a different configuration then, get a new one calling the plugin function with the new configuration. it has been though in this way due that how we think that [gitevents microservice](https://github.com/gitevents/gitevents) should work, that basically it should configure all the actions (plugins) in the boostrapt and use them when GitHub web hook is fired; if the configuration change, then microservice should restart, or maybe do a hot swap but not to have to configure the plugins on every web hook call that requires that specific action (plugin).

This plugin return the object with one only method, `send` which must receive 3 arguments:
  * `{Object} to`: this parameter will be passed straightaway to [provider.send](#provider-api-plugin)

For this module we've thought that options object should have as required options:
* `provider`: The provider module which implement the [Provider API plugin](#provider-api-plugin)
* `renderer`: The renderer module which implement the [Renderer API plugin](#renderer-api-plugin)
* `sendParams`: An object with all the required and optional parameters that `provider.send` require and that only have to be passed ones, they are: `from`, `cc`, `bcc` and `options`, if they are optional then they don't need to be provided, see them in [Provider API plugin](#provider-api-plugin)
* `done`: Node callback function convention.


## Provider API plugin

The first approach that we've thought for the provider's API is

Any __provider__ plugin must export a function wich takes an `options {Object}` which contains the parameter that the email provider wrapped by the plugin needs; having an object we don't have to take car if a provider needs more options or less than others.

And it __returns an object__ which at least must have `send` method; it could be just a function, but an object has more flexibility to offer more methods if we need in the future, making easy backward compatibility.

For `send` method we've roughly thought to have the next fixed parameters:

1. `{Object} from`: Object with 2 properties:
  * `{String} name`: Name to show.
  * `{String} address`: email address.
2. `{Array} to`: Array of objects with the same 2 properties than `from` object.
3. `{Array} cc`: Same as `to` but for `cc`.
4. `{Array} bcc`: Same as `to` but for `bcc`.
5. `{String} subject`: Message subject.
6. `{Object} body`: Object with 2 properties:
  * `{String} html`: HTML version of the message's body.
  * `{String} text`: Plain text version of the message's body.
7. `{Object} options` (optional): An object with  specific properties of the implemented provider. Note they are unlikely compatible between different providers, therefore if you change the provider, then you will have to update it, moreover some providers can ignore it. In the most of the cases, they would unlikely needed, e.g. attachments.

Send method may contain some parameters that they aren't often used, however we thought to have as a parameter because they are very common to any email send action; however to avoid the complexity to manage optional parameters moreover they make the code more difficult to understand, if there are too many, then we may move them to the `options` object.

## Renderer API plugin

Any __renderer__ plugin module must export a function which must receive the next parameters:

1. `{String} subject`: A string with the text template to use as subject.
2. `{String} htmlTemplate`: A string with the HTML version of the template to render<sup>*1</sup>.
3. `{String} textTemplate`: A string with the plain text version of the template to render<sup>*1</sup>.
4. `{Object} locals`: An object which contains the template variables values to use as default, if none are needed then `null`.
5. `{Object} config (optional)`: An object which contains specific configurations for the template library. Note they are unlikely compatible between different renderers, hence if you change the renderer then you may have to update it, furthermore some renderer may ignore this parameters.

  Although __two templates types have to pass as a parameter we may only require one__, then one of them can be null, obviously the result will only contain the provided one.
  <sup>*1</sup> it can be the string with the template content, a file path, an URL or whatever the renderer supports.

  And it has to __return__ a `function` which only accepts one parameter:

  1. `data {Object}`: An object which contains the template variable values to use; if one of them is not provided and it has been defined in `locals` then its values will be used. If no data, then `null`.
  2. `done {Function}`: Node callback function convention, which if succeeds return an object with the next properties:
    * `{String} subject`: The subject rendered text.
    * `{String} html`: The rendered HTML version of the template or null if HTML version hasn't been provided.
    * `{String} text`: The rendered plain text version of the template or null if plain text version hasn't been provided.

~~We know that the most of the template engines render templates from files, however to keep the API simple we suggest to only render string templates for two main reasons:~~

In the first draft of this document, before any implementation the previous strikethrough lines where mentioned, for the next two reasons:

>1. Render from file is something we want to do, however reading a file from a disk is something that can be done as standalone tool/util/helper and avoid complexity in renderers implementations and duplicate functionality which should be tested as well. I've also thought that email templates are quite complicated and they have a lot of pain points if they are compatible for at least the most email clients, desktop and browser ones, then keeping them as a single template without partials and layout extension (inheritance), so a single and simple string is enough.
>2. Even though to render templates from files seem as a requirement for `gitevents`, we consider that it isn't because the group want to host the template in a public URL (e.g. a Github gist), then the renderer's API should have another function for templates available in an URL, then as I've commented previously the API should be more complex and probably the renders would have duplicated functionality.
>
>A challenging point here is if with this interface we could implement a renderer which use remote templates hosted by the email provider, for example, using a mailchimp provider we can implement a specific renderer that allows to the provider to use its template API, of course mailchimp renderer would only work with mailchimp provider, however mailchimp provider must work as any other renderer which is not specific of an email provider.

Those reasons still partially applicable, however, if the plugin has to be setup in the bootstrap of  [gitevents microservice](https://github.com/gitevents/gitevents) and use it to send a type of email per instance and avoid to implement the logic of rendering the email content and passing it to each `send`, it has been moved inside this plugin, which makes sense because they're bound and have the same target; for this reason the renderer receive a callback because it may be asynchronous if the templates are files paths, URL or another kind of IO. Nonetheless we could be implemented in somewhere that can be reused, see [utilities section](#Utilities)

So far we have an example of a renderer, however it was implemented with the first hackday which we ran on 18/01/2015 and it was a pair programming with a teaching purpose; this document was not available at that moment, for that reason it does not fulfil with the current Renderer API plugin.

You can see `swig` renderer on [gajjargaurav/gitup-mailer-renderer-swig](https://github.com/gajjargaurav/gitup-mailer-renderer-swig)


## Utilities

This section is here to have a thought in common utilities that they are also needed, e.g. read a template from an URL or a file to pass the content to the renderers; however these may be provided by the module itself, hence the approach is under discussion.

## Other plugins

We leave this section to think about to have other kind of plugins to perform required actions which are not defined in any other specified plugin so far but they are required by the [Specification](#specification), e.g access to email addresses list; however they could be in another plugin or in one already defined.

## LICENSE

MIT license, read [LICENSE file](https://github.com/GitEvents/gitevents-mailer/blob/master/LICENSE) for more information.
