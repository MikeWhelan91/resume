export const limitExperience = (experience = [], maxExp = 5, maxBullets = 5) =>
  (experience || [])
    .filter(exp => exp && exp.title && exp.title.trim())
    .slice(0, maxExp)
    .map(exp => ({
      ...exp,
      bullets: (exp.bullets || [])
        .filter(b => b && b.trim())
        .slice(0, maxBullets),
    }));

export const limitEducation = (education = [], maxEdu = 4) =>
  (education || [])
    .filter(edu => edu && (edu.area || edu.degree))
    .slice(0, maxEdu);

export const limitCoverLetter = (coverLetter = '', maxParagraphs = 3) =>
  (coverLetter || '')
    .split('\n\n')
    .filter(p => p.trim())
    .slice(0, maxParagraphs);
