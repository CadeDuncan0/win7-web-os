'use client'

import styles from './ProjectsPage.module.css'

const PLACEHOLDER_CARDS = [
  {
    title: 'Portfolio Website',
    description: 'A Windows 7 themed portfolio site',
    tags: ['React', 'TypeScript', 'Next.js'],
  },
  {
    title: 'Project Alpha',
    description: 'Placeholder project description',
    tags: ['Node.js', 'GraphQL'],
  },
  {
    title: 'Project Beta',
    description: 'Placeholder project description',
    tags: ['Python', 'PostgreSQL'],
  },
]

export function ProjectsPage() {
  return (
    <div className={styles.projectsPage}>
      <h1 className={styles.heading}>Projects</h1>
      <div className={styles.grid}>
        {PLACEHOLDER_CARDS.map((card) => (
          <div key={card.title} className={styles.card}>
            <div className={styles.thumbnail} />
            <div className={styles.cardTitle}>{card.title}</div>
            <div className={styles.cardDesc}>{card.description}</div>
            <div className={styles.tags}>
              {card.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
