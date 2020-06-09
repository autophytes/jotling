// Import dependencies
import React from 'react';
import { render } from 'react-dom';

// Import main App component
import App from './components/app';

// Import CSS stylesheet
import './styles/app.css';

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it
let root = document.createElement('div');

// Append root div to body
root.id = 'root';
document.body.appendChild(root);

// Render the app into the root div
render(<App />, document.getElementById('root'));
