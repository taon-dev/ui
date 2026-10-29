# ui

Hello from Standalone Project

<img src="./image.png" style="width: 100%">

## Context-aware admin navigation

`menuItem` accepts a plain string, a function returning a string, or an Angular
`Signal<string>`:

```ts
menuItem: 'Users',
menuItem: () => `Users (${userCount()})`,
menuItem: usersLabel, // e.g. signal('Users') or computed(() => 'Users')
```

These are alternative values for the same option. Functions and signals are read
when rendering sidebar items and nested tabs, so signal updates refresh labels
without reloading routes. Existing string labels remain supported. Omitting
`menuItem` keeps the label derived from the route path.

`adminLazyRoute<TContext>()` accepts any application-defined context type.
Existing routes without context callbacks continue to work.

```ts
interface MyAuthContext {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

adminLazyRoute<MyAuthContext>({
  path: 'sudo',
  menuItem: 'Sudo',
  color: 'red',
  icon: 'supervisor_account',
  expandable: false,
  isDisabled: ({ context }) => !context.isAuthenticated,
  isDisabledTooltip: ({ context }) =>
    context.isAuthenticated ? '' : 'You must be authenticated to use Sudo',
  isVisible: ({ context }) => context.isAdmin,
  loader: () =>
    import('@taon-dev/sudo/src').then(m => m.TaonSudoBackofficeRoutes),
});
```

Supply the matching context to the panel enclosing the admin router outlet:

```html
<taon-draggable-button-panel
  [context]="authContext"
  outlet="admin"
  basePath="main">
  <router-outlet name="admin" />
</taon-draggable-button-panel>
```

The panel shares its current context with the routed admin layout and nested
navigation tabs. Updating the context input (for example, assigning a new
`authContext` object when authentication changes) updates the menu without
reloading route metadata. Provide a context value whenever callbacks require it.

`isVisible` returning `false` removes the menu item from rendering.
`isDisabled` returning `true` keeps the item visible with reduced opacity, but
prevents menu navigation and expansion. `isDisabledTooltip` is evaluated only
for disabled items. These options control navigation UI, not access to URLs;
use Angular route guards for authorization.

`icon` uses Angular Material's `MatIcon['fontIcon']` type (`string`), supporting
Material icon ligatures without maintaining a partial list of icon names.
