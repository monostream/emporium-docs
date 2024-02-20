# `@userSupplied` Syntax

The `@userSupplied` syntax employs tags that permit app developers to indicate specific variables in the `values.emporium.yaml` as supplied by the user. Emporium then generates corresponding input fields on the app installation screen.

Every line should begin with `##` to be parsed. Every variable block should commence with `@userSupplied`. Subsequent tags are considered up to the next `@userSupplied` tag or the end of the file. The order of variable blocks doesn't affect the outcome. The variable name specified in `@userSupplied [variable name]` should match the usage in the template (`.Emporium.UserSupplied.[variable name]`).

## Tags

The following tags are available.

| Tag                          | Description                                                                                                 | Required | Default |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- | ------- |
| `@userSupplied [variable]`   | Identifies a variable as user-supplied. `[variable]` is the key name used in `.Emporium.UserSupplied` map.  | Yes      | ""      |
| `@label [label]`             | Sets a label for the variable.                                                                              | No       | ""      |
| `@type [type]`               | Sets the variable type. Available are `{string, boolean, integer}`                                                                                   | No       | string  |
| `@description [description]` | Sets a description for the variable.                                                                        | No       | ""      |
| `@optional`                  | Indicates a user-supplied variable as optional. By default, all variables are required.                     | No       | false   |

## Example

Here's an example for a variable named `AdminPassword`. This variable can be accessed within `values.emporium.yaml` as `.Emporium.UserSupplied.AdminPassword`.


```yaml emporium.values.yaml
## @userSupplied AdminPassword
## @label Password
## @type string
## @description Must be at least 10 characters long
authentication:
  admin:
    password: {{ .Emporium.UserSupplied.AdminPassword }}
```

On the install screen of the Emporium UI, users will se a text field with the label "Password" and a description text "Must be at least 10 characters long".


```yaml emporium.values.yaml
## @userSupplied RocketModeEnabled
## @label RocketModeEnabled
## @type boolean
## @description Enable rocket mode if you want to moon
authentication:
  admin:
    password: {{ .Emporium.UserSupplied.RocketModeEnabled }}
```

A checkbox is displayed on the install screen.