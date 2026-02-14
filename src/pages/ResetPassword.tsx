import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { updatePassword } from '../utils/api';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const userJson = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const currentUser = userJson ? JSON.parse(userJson) : null;
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser) {
            setError('');
            if (newPwd.length < 8) {
                setError('Password minimal 8 karakter.');
                return;
            }
            if (newPwd !== confirmPwd) {
                setError('Konfirmasi password tidak cocok.');
                return;
            }
            updatePassword(currentUser.id, newPwd, oldPwd)
                .then(() => setSubmitted(true))
                .catch(err => setError(err?.message || 'Gagal mengubah password.'));
        } else {
            setSubmitted(true);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                {submitted ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-check-circle text-3xl"></i>
                        </div>
                        <h1 className="text-2xl font-bold">{currentUser ? 'Password Changed' : 'Request Submitted'}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {currentUser
                                ? <>Password Anda telah berhasil diubah.</>
                                : <>If an account with the email <strong>{email}</strong> exists, a password reset link has been sent to it. Please check your inbox.</>}
                        </p>
                        <Link to="/login/client" className="mt-6 inline-block text-primary-600 hover:text-primary-500 font-medium">
                           &larr; Back to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold">{currentUser ? 'Change Your Password' : 'Reset Your Password'}</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                {currentUser
                                    ? 'Masukkan password lama dan password baru Anda.'
                                    : "Enter your email address and we'll send you a link to get back into your account."}
                            </p>
                        </div>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {currentUser ? (
                                <>
                                    <div>
                                        <label htmlFor="oldPwd" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Lama</label>
                                        <div className="mt-1 relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                <i className="fas fa-lock text-gray-400"></i>
                                            </span>
                                            <input id="oldPwd" name="oldPwd" type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} required
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="newPwd" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password Baru</label>
                                        <div className="mt-1 relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                <i className="fas fa-lock text-gray-400"></i>
                                            </span>
                                            <input id="newPwd" name="newPwd" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="Minimal 8 karakter"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="confirmPwd" className="text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi Password</label>
                                        <div className="mt-1 relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                                <i className="fas fa-lock text-gray-400"></i>
                                            </span>
                                            <input id="confirmPwd" name="confirmPwd" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="Ulangi password baru"
                                            />
                                        </div>
                                    </div>
                                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                                </>
                            ) : (
                                <div>
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                    <div className="mt-1 relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                            <i className="fas fa-envelope text-gray-400"></i>
                                        </span>
                                        <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                                >
                                    {currentUser ? 'Change Password' : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                        <p className="text-center text-sm">
                            <Link to="/login/client" className="font-medium text-primary-600 hover:text-primary-500">
                               &larr; Back to Login
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
