import React, { useState } from 'react';
import { Upload, Camera, X, Loader, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const ImageUpload = ({ onAnalysisComplete, complaintText = '' }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1];
        
        const response = await api.post('/chatbot/analyze-image', {
          image: base64Image,
          complaintText
        });

        setAnalysis(response.data.analysis);
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data.analysis);
        }
      };
      reader.readAsDataURL(image);
    } catch (error) {
      console.error('Image analysis error:', error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    setAnalysis(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-2">Click to upload complaint image</p>
            <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
          </label>
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Complaint"
            className="w-full h-64 object-cover rounded-lg"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
          >
            <X size={18} />
          </button>
          
          {!analysis && !analyzing && (
            <button
              onClick={analyzeImage}
              className="absolute bottom-2 right-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Camera size={18} />
              <span>Analyze with AI</span>
            </button>
          )}
        </div>
      )}

      {/* Analyzing State */}
      {analyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
          <Loader size={20} className="animate-spin text-blue-600" />
          <span className="text-blue-700">Analyzing image with AI...</span>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2 text-green-700 font-semibold">
            <CheckCircle size={20} />
            <span>AI Analysis Complete</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600 font-medium">Category:</span>
              <p className="text-gray-800">{analysis.category}</p>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Severity:</span>
              <p className={`font-semibold ${
                analysis.severity === 'Critical' ? 'text-red-600' :
                analysis.severity === 'High' ? 'text-orange-600' :
                analysis.severity === 'Medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>{analysis.severity}</p>
            </div>
          </div>

          <div className="text-sm">
            <span className="text-gray-600 font-medium">Description:</span>
            <p className="text-gray-800 mt-1">{analysis.description}</p>
          </div>

          <div className="text-sm">
            <span className="text-gray-600 font-medium">Suggested Action:</span>
            <p className="text-gray-800 mt-1">{analysis.suggestedAction}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
