export const getPosition = (rankStr) => {
  if (!rankStr) return 999;
  const num = parseInt(rankStr.replace(/\D/g, ''), 10);
  return isNaN(num) ? 999 : num;
};

export const allCompetitions = Object.values(import.meta.glob('../achievements/*.md', { eager: true }));

export const getCompetitionsByCategory = (category) => allCompetitions
  .filter(entry => entry.frontmatter.category === category)
  .sort((a, b) => getPosition(a.frontmatter.rank) - getPosition(b.frontmatter.rank));
