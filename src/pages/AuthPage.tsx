import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {supabase} from '../supabase'; // ✅ Changed to Supabase
import {isAdmin} from '../admin';
import Input from "../components/Input";
import Button from "../components/Button";
import styles from "./AuthPage.module.css";

const AuthPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [emailHistory, setEmailHistory] = useState<string[]>([]);

    // Helper to detect if we are on the "landing" of a magic link
    const isMagicLink = (url: string) => {
        return url.includes('access_token') || url.includes('type=magiclink') || url.includes('code=');
    };

    // Load email history from localStorage
    useEffect(() => {
        const savedEmails = localStorage.getItem('emailHistory');
        if (savedEmails) {
            try {
                const parsed = JSON.parse(savedEmails);
                if (Array.isArray(parsed)) {
                    setEmailHistory(parsed);
                }
            } catch (e) {
                console.error('Failed to parse email history', e);
            }
        }
    }, []);

    // Handle email link sign-in (Supabase Version)
    useEffect(() => {
        const handleSignIn = async () => {
            // ✅ Check for Supabase hash/query params instead of Firebase helper
            if (isMagicLink(window.location.href)) {
                setIsProcessing(true);

                try {
                    // ✅ Supabase Client automatically detects the hash/code on load and sets the session.
                    // We just need to retrieve it.
                    const { data: { session }, error } = await supabase.auth.getSession();

                    if (error) throw error;

                    if (session?.user) {
                        // Check if user is admin
                        if (!isAdmin(session.user.id)) {
                            await supabase.auth.signOut();
                            setMessage('⛔ You do not have admin privileges');
                            setIsProcessing(false);
                            return;
                        }

                        // Save email to history (using the verified email from session)
                        const confirmedEmail = session.user.email || '';
                        if (confirmedEmail && !emailHistory.includes(confirmedEmail)) {
                            const newHistory = [confirmedEmail, ...emailHistory.filter(e => e !== confirmedEmail)].slice(0, 5);
                            setEmailHistory(newHistory);
                            localStorage.setItem('emailHistory', JSON.stringify(newHistory));
                        }

                        localStorage.removeItem('emailForSignIn');
                        navigate('/');
                    } else {
                        // If we have a code but no session yet, wait slightly or handle as error
                        // usually getSession resolves this immediately.
                        throw new Error("Session could not be established.");
                    }
                } catch (error) {
                    console.error('Email sign-in error:', error);
                    setMessage('Error completing sign-in. Please try again.');
                    setIsProcessing(false);
                }
            }
        };

        handleSignIn();
    }, [navigate, emailHistory]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setMessage('');

        try {
            // ✅ Supabase Magic Link
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.href, // Redirect back here
                }
            });

            if (error) throw error;

            localStorage.setItem('emailForSignIn', email);

            // Add to email history
            const newHistory = [email, ...emailHistory.filter(e => e !== email)].slice(0, 5);
            setEmailHistory(newHistory);
            localStorage.setItem('emailHistory', JSON.stringify(newHistory));

            setMessage('✅ Sign-in link sent to your email!');
        } catch (error: any) {
            console.error('Error sending sign-in link:', error);
            setMessage(`❌ ${error.message || 'Failed to send sign-in link'}`);
        }
        setIsProcessing(false);
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.card}>
                <h1 className={styles.title}>Admin Login</h1>

                {message && (
                    <p className={styles.message}>
                        {message}
                    </p>
                )}

                {/* ✅ Supabase "consumes" the link automatically via the hash, so we
                   stay in 'isProcessing' state until the redirect happens.
                   The "Enter email manually" UI is preserved below but typically won't be seen
                   because Supabase doesn't require manual email re-entry for Magic Links.
                */}
                {isProcessing ? (
                    <p className={styles.description}>Processing...</p>
                ) : isMagicLink(window.location.href) ? (
                    <div>
                        <p className={styles.description}>Verifying secure link...</p>
                        {/* This form is kept to match your structure, but Supabase auth
                            typically bypasses this need. It serves as a fallback UI.
                        */}
                        <form onSubmit={handleEmailSubmit} className={styles.form}>
                            {/* Reusing existing components to maintain style */}
                            <Input
                                id="email-verify"
                                label="Your Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your email"
                                required
                                list="email-history"
                            />
                            <datalist id="email-history">
                                {emailHistory.map((email, i) => (
                                    <option key={i} value={email}/>
                                ))}
                            </datalist>
                            <Button styleType="positive" type="submit">
                                Retry Sign-in
                            </Button>
                        </form>
                    </div>
                ) : (
                    <form onSubmit={handleEmailSubmit} className={styles.form}>
                        <Input
                            id="email-signin"
                            label="Your Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email"
                            required
                            list="email-history"
                        />
                        <datalist id="email-history">
                            {emailHistory.map((email, i) => (
                                <option key={i} value={email}/>
                            ))}
                        </datalist>
                        <Button
                            styleType="positive"
                            type="submit"
                            disabled={isProcessing}
                        >
                            Send Sign-in Link
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthPage;