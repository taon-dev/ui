How to use this

```ts
dialog = inject(MatDialog);
const ref = this.dialog.open(TaonConfirmDialogComponent, {
  width: '376px',
  panelClass: 'clean-confirm-dialog',
  data: {
    title: this.t.gettext(
      'Buy [[ parentProductTitle ]] for [[ productPrice ]] ?',
      {
        parentProductTitle: product.parentProductTitle,
        productPrice: product.price,
      },
    ),
    message: this.t.gettext("Video '[[ productTitle ]]' included.", {
      productTitle: product.productTitle,
    }),
    confirmText: this.t.gettext('Buy'),
    cancelText: this.t.gettext('Cancel'),
  },
});

ref.afterClosed().subscribe(async confirmed => {
  if (!confirmed) return;

  const button = this.buyButtons.find(
    c => c.priceId === product.stripePriceId,
  );

  await button?.buy();
});

      ```
