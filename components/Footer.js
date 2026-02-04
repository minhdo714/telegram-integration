import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.content}>
                    <div className={styles.brand}>
                        <h3>OFCharmer</h3>
                        <p>Turn Telegram Chats Into Paying Fans.</p>
                        <p>© {new Date().getFullYear()} OFCharmer. All rights reserved.</p>
                    </div>

                    <div className={styles.links}>
                        <div className={styles.column}>
                            <h4>Legal</h4>
                            <ul>
                                <li><Link href="/terms">Terms of Service</Link></li>
                                <li><Link href="/privacy">Privacy Policy</Link></li>
                                <li><Link href="/acceptable-use">Acceptable Use Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
