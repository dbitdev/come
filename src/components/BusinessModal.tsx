"use client";

import React from 'react';
import styles from './BusinessModal.module.css';
import { 
    X, 
    MapPin, 
    Clock, 
    Phone, 
    Mail, 
    Award, 
    ExternalLink, 
    Star 
} from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa';
import { slugify } from '@/lib/utils';

interface BusinessModalProps {
    isOpen: boolean;
    onClose: () => void;
    business: any;
}

export default function BusinessModal({ isOpen, onClose, business }: BusinessModalProps) {
    if (!isOpen || !business) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} strokeWidth={1.5} />
                </button>

                <div className={styles.hero}>
                    <img src={business.image} alt={business.name} className={styles.image} />
                    <div className={styles.headerInfo}>
                        <div className={styles.category}>{business.category}</div>
                        <h2 className={styles.name}>{business.name}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Star size={16} fill="#ffc107" color="#ffc107" />
                            <span style={{ fontWeight: 700 }}>{business.rating}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.content}>
                    <div className={styles.grid}>
                        <div className={styles.mainInfo}>
                            <section>
                                <h3 className={styles.sectionTitle}>Sobre el lugar</h3>
                                <p className={styles.text}>
                                    {business.description || "Descubre lo mejor de nuestra cocina en un ambiente excepcional. Cada platillo está preparado con los ingredientes más frescos y la pasión de nuestro equipo."}
                                </p>
                            </section>

                            {business.awards && (
                                <div className={styles.awardBadge} style={{ 
                                    backgroundColor: business.awards.toLowerCase().includes('michelin') ? '#fff5f5' : '#f0f9ff',
                                    color: business.awards.toLowerCase().includes('michelin') ? '#e53e3e' : '#0369a1',
                                    borderColor: business.awards.toLowerCase().includes('michelin') ? '#fed7d7' : '#bae6fd'
                                }}>
                                    {business.awards.toLowerCase().includes('michelin') ? (
                                        <img src="/michelin-star.png" alt="Michelin" style={{ width: '20px', height: '20px' }} />
                                    ) : (
                                        <Award size={18} strokeWidth={1.5} />
                                    )}
                                    <span>{business.awards}</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.sideInfo}>
                            <h3 className={styles.sectionTitle}>Contacto</h3>
                            <div className={styles.infoList}>
                                <div className={styles.infoItem}>
                                    <MapPin className={styles.infoIcon} size={18} strokeWidth={1.5} />
                                    <div>
                                        <span className={styles.infoLabel}>Dirección</span>
                                        <span className={styles.infoValue}>{business.address}</span>
                                    </div>
                                </div>
                                {business.schedule && (
                                    <div className={styles.infoItem}>
                                        <Clock className={styles.infoIcon} size={18} strokeWidth={1.5} />
                                        <div>
                                            <span className={styles.infoLabel}>Horario</span>
                                            <span className={styles.infoValue}>{business.schedule}</span>
                                        </div>
                                    </div>
                                )}
                                {business.phone && (
                                    <div className={styles.infoItem}>
                                        <Phone className={styles.infoIcon} size={18} strokeWidth={1.5} />
                                        <div>
                                            <span className={styles.infoLabel}>Teléfono</span>
                                            <span className={styles.infoValue}>{business.phone}</span>
                                        </div>
                                    </div>
                                )}
                                {business.email && (
                                    <div className={styles.infoItem}>
                                        <Mail className={styles.infoIcon} size={18} strokeWidth={1.5} />
                                        <div>
                                            <span className={styles.infoLabel}>Email</span>
                                            <span className={styles.infoValue}>{business.email}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <a 
                            href={business.isFirebase ? `https://${business.subdomain}` : `/lugares/${slugify(business.restaurantName || business.name)}`} 
                            target={business.isFirebase ? "_blank" : "_self"}
                            className={styles.menuBtn}
                            rel="noopener noreferrer"
                        >
                            Ver Menú Digital <ExternalLink style={{ marginLeft: '8px', fontSize: '0.8em' }} size={16} strokeWidth={1.5} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
