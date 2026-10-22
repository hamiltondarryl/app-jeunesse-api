describe('Santé de la suite fonctionnelle', () => {
  it('ne dépend pas d’un jeu de données en ligne', () => {
    expect(process.env.npm_package_name === 'diwa-api').toBe(false);
  });
});
