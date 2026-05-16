import { useState } from 'react';
import './Loader.css';

const Loader = ({ size = "medium" }) => {
    return (
        <div className={`loader-container ${size}`}>
            <div className="spinner"></div>
        </div>
    );
};

export default Loader;
