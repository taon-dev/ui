# Taon Detachable Dialog Content

`taon-detachable-dialog-content` allows a routed Taon Admin component
to create a persistent detached copy of itself.

Detached windows are independent Angular component instances and survive
normal Angular Router navigation.

This allows Taon Admin to behave like a small desktop workspace:

```text
                    TAON ADMIN

 ┌──── Users ──────────────┐
 │                         │
 │                         │
 └─────────────────────────┘

          ┌──── Posts ──────────────┐
          │                         │
          │                         │
          └─────────────────────────┘

                 ┌──── Post #123 ─────────┐
                 │                        │
                 │                        │
                 └────────────────────────┘
```

You can detach `/users`, navigate to `/posts`, detach that page,
open `/cms/posts/123`, detach that page, and then navigate anywhere else.

All three detached components remain alive and can continue communicating
with the backend.

---

## 1. Add the global detached windows host

The host MUST live outside the routed component tree.

For example, inside the main Taon Admin component:

```ts
@Component({
  imports: [
    RouterOutlet,
    TaonDetachedWindowsHostComponent,
  ],
  template: `
    <router-outlet />

  `,
})
export class TaonAdminComponent {}
```

Do NOT put `taon-detached-windows-host` inside a component that gets
destroyed during navigation.

There should normally be only one host.

---

## 2. Make a page detachable

Example users component:

```ts
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    TaonDetachableDialogContentComponent,
  ],
  template: `
    <taon-detachable-dialog-content
      title="Users"
      [component]="UsersComponent">

      <h1>Users</h1>

      <app-users-table />

    </taon-detachable-dialog-content>
  `,
})
export class UsersComponent {
  readonly UsersComponent = UsersComponent;
}
```

The normal page displays:

```text
┌──────────────────────────────────── ↗ ┐
│ Users                                 │
│                                       │
│ ...                                   │
└───────────────────────────────────────┘
```

Clicking `↗` creates another `UsersComponent`.

It does NOT move the existing DOM/component.

---

## 3. Navigate somewhere else

After detaching Users:

```text
/users
   ↓
detach
   ↓
[ Users detached window ]
```

You can navigate to:

```text
/posts
```

The original routed `UsersComponent` is destroyed normally.

The detached `UsersComponent` is NOT destroyed because it belongs to:

```text
TaonAdminComponent
│
├── RouterOutlet
│   └── PostsComponent
│
└── TaonDetachedWindowsHostComponent
    └── UsersComponent
```

---

## 4. Detach another page

Posts:

```ts
@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [
    TaonDetachableDialogContentComponent,
  ],
  template: `
    <taon-detachable-dialog-content
      title="Posts"
      [component]="PostsComponent">

      <app-posts-table />

    </taon-detachable-dialog-content>
  `,
})
export class PostsComponent {
  readonly PostsComponent = PostsComponent;
}
```

You can now have:

```text
┌──── Users ──────────────┐

           ┌──── Posts ──────────────┐
```

at the same time.

---

## 5. Route parameters are copied

Consider:

```text
/cms/posts/123
```

with:

```ts
const id = inject(ActivatedRoute)
  .snapshot
  .params['id'];
```

When the page is detached, Taon captures the route state.

The detached component receives its own `ActivatedRoute` containing:

```ts
params = {
  id: '123',
};
```

Therefore the new component can load Post #123 normally.

Navigating afterward to:

```text
/cms/posts/456
```

does NOT change the detached window.

You can therefore have:

```text
┌──── Post #123 ────────┐

          ┌──── Post #456 ────────┐
```

simultaneously.

---

## 6. Query parameters

Query parameters are also captured.

For example:

```text
/users?page=5&search=john
```

creates a detached component with:

```ts
route.snapshot.queryParams
```

equivalent to:

```ts
{
  page: '5',
  search: 'john',
}
```

The detached route is intentionally independent from subsequent browser
navigation.

---

## 7. Database operations

A detached component is a REAL Angular component.

It can continue using normal Taon services/controllers:

```ts
await this.usersController
  .update(user);
```

or:

```ts
this.postsController
  .getAll();
```

There is nothing special about backend communication from a detached
window.

For example:

```text
Browser route:

/admin/settings


Desktop:

┌──── Users ───────────────────┐
│ John                         │
│ Kate                         │
│ Mark                         │
│                    [delete]  │
└──────────────────────────────┘


       ┌──── Posts ───────────────────┐
       │ Hello World                 │
       │ Taon documentation          │
       │                     [edit]  │
       └─────────────────────────────┘
```

Both windows can still modify database data.

---

## 8. Component state

Detaching creates a NEW component instance.

It does not transfer arbitrary local component state.

For example, if the routed component contains:

```ts
form.patchValue({
  title: 'unsaved title',
});
```

the detached component will initialize normally and usually reload its
data from the backend.

The unsaved form value is NOT automatically copied.

This is intentional.

Route state is copied.

Component state is not.

State transfer can be implemented separately later if needed.

---

## 9. Multiple instances

`TaonDetachedWindowsService` intentionally stores an array:

```ts
readonly windows =
  signal<TaonDetachedWindow[]>([]);
```

There is no single-dialog restriction.

The following is valid:

```text
Users
Users filtered by admin
Posts
Post #123
Post #456
Permissions
Database
```

all open simultaneously.

---

## Architecture

The important ownership model is:

```text
TaonAdminComponent
│
├── RouterOutlet
│
│   └── current routed page
│
│
└── TaonDetachedWindowsHostComponent
    │
    ├── UsersComponent
    │
    ├── PostsComponent
    │
    ├── PostComponent (id=123)
    │
    └── PostComponent (id=456)
```

Angular Router controls only the first branch.

Detached windows belong to the second branch.

Therefore:

```text
router navigation
      ↓
destroys routed component
      ↓
does NOT destroy detached windows
```

---

## Future improvements

The detached-window infrastructure can later support:

- minimize
- maximize
- fullscreen
- z-index / bring-to-front
- remembered window position
- remembered window size
- taskbar
- window titles based on entity data
- restoring workspace after refresh
- duplicate prevention
- multiple instances of the same route
- synchronization/reload events between windows
- integration with Taon's existing draggable admin panel

A useful next abstraction would be:

```ts
TaonWorkspaceWindow
```

where detachable routed content is only one way of creating a workspace
window.
