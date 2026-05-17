import React, { useState, useRef } from 'react';
import { Upload, X, Image } from 'lucide-react';

const ImageUpload = ({ value, onChange, label = 'Upload Image', accept = 'image/*' }) => {
  const [preview, setPreview] = useState(value || null);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    onChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-muted uppercase tracking-widest">{label}</label>
      {preview ? (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-border group">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-video rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-input cursor-pointer flex flex-col items-center justify-center gap-3 transition-colors group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Image size={24} className="text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-heading">Click to upload</p>
            <p className="text-xs text-muted mt-1">PNG, JPG, WEBP up to 5MB</p>
          </div>
          <div className="flex items-center gap-2 bg-button-alt-bg text-button-alt-text border border-border px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest group-hover:bg-button-bg group-hover:text-button-text transition-all shadow-premium-sm">
            <Upload size={14} />
            Browse Files
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUpload;
