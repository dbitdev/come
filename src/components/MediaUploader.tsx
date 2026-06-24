"use client";

import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { FaUpload, FaImage, FaVideo, FaTimes, FaCheck } from 'react-icons/fa';

interface MediaUploaderProps {
    onUploadComplete: (url: string, type: 'image' | 'video') => void;
    folder?: string;
}

export default function MediaUploader({ onUploadComplete, folder = 'general' }: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !storage) return;

        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isImage && !isVideo) {
            alert("Solo se permiten imágenes o videos.");
            return;
        }

        setMediaType(isImage ? 'image' : 'video');
        setUploading(true);
        setProgress(0);

        // Preview (only for images)
        if (isImage) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }

        try {
            const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(prog);
                }, 
                (error) => {
                    console.error("Upload error:", error);
                    alert("Error al subir el archivo.");
                    setUploading(false);
                }, 
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    onUploadComplete(downloadURL, isImage ? 'image' : 'video');
                    setUploading(false);
                    setPreview(null);
                }
            );
        } catch (err) {
            console.error(err);
            setUploading(false);
        }
    };

    return (
        <div className="media-uploader-container">
            <div className="upload-box">
                {uploading ? (
                    <div className="upload-status">
                        <div className="spinner"></div>
                        <span>Subiendo... {Math.round(progress)}%</span>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                ) : (
                    <label className="upload-label">
                        <input 
                            type="file" 
                            accept="image/*,video/*" 
                            onChange={handleFileChange} 
                            style={{ display: 'none' }}
                        />
                        <div className="upload-content">
                            <FaUpload className="icon" />
                            <span>Subir Media (Imagen/Video)</span>
                        </div>
                    </label>
                )}
            </div>

            {preview && (
                <div className="preview-container">
                    <img src={preview} alt="Vista previa" />
                    <button onClick={() => setPreview(null)} className="remove-preview">
                        <FaTimes />
                    </button>
                </div>
            )}

            <style jsx>{`
                .media-uploader-container {
                    width: 100%;
                    margin: 1rem 0;
                }
                .upload-box {
                    border: 2px dashed #eee;
                    border-radius: 12px;
                    padding: 1.5rem;
                    text-align: center;
                    transition: border-color 0.2s;
                    background: #fafafa;
                }
                .upload-box:hover {
                    border-color: var(--primary);
                }
                .upload-label {
                    cursor: pointer;
                    display: block;
                }
                .upload-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    color: #666;
                }
                .upload-content .icon {
                    font-size: 1.5rem;
                }
                .upload-content span {
                    font-weight: 600;
                    font-size: 0.9rem;
                }
                .upload-status {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: #eee;
                    border-radius: 3px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: var(--primary);
                    transition: width 0.3s;
                }
                .preview-container {
                    position: relative;
                    margin-top: 1rem;
                    border-radius: 8px;
                    overflow: hidden;
                    width: 150px;
                    height: 100px;
                    border: 1px solid #eee;
                }
                .preview-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .remove-preview {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(0,0,0,0.5);
                    color: #fff;
                    border: none;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #eee;
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
