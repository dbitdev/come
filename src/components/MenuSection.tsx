import styles from './MenuSection.module.css';

const MOCK_DISHES = [
    {
        title: "Bastiart of wedges",
        price: "$240",
        description: "Crispy potato wedges with extra crunchy crust.",
        image: "https://images.unsplash.com/photo-1573016608244-7d5fa1fa7657?auto=format&fit=crop&w=150"
    },
    {
        title: "Chicken Burgers",
        price: "$380",
        description: "Homemade chicken burger with farm-fresh sauce.",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=150"
    },
    {
        title: "Soft sugar donuts",
        price: "$120",
        description: "Classic glazed donuts with organic cane sugar.",
        image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=150"
    }
];

export default function MenuSection() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {MOCK_DISHES.map((dish, idx) => (
                        <div key={idx} className={styles.dishCard}>
                            <span className={styles.dishNum}>{String(idx + 1).padStart(2, '0')}</span>
                            <div className={styles.imageCol}>
                                <img src={dish.image} alt={dish.title} className={styles.dishImg} />
                            </div>
                            <div className={styles.contentCol}>
                                <div className={styles.header}>
                                    <h3 className={styles.title}>{dish.title}</h3>
                                    <span className={styles.dots}></span>
                                    <span className={styles.price}>{dish.price}</span>
                                </div>
                                <p className={styles.desc}>{dish.description}</p>
                                <button className={styles.readMore}>Saber más</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
