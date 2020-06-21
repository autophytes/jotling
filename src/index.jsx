// Import dependencies
import React from 'react';
import { render } from 'react-dom';

// Import main App component
import App from './components/app';

// Import CSS stylesheets
import './styles/Draft.css';
// This is copied from /node_modules/dist/Draft.css.
// If Draft updates their CSS sheet, I'll need to update this manually.
// I think it was webpack having an issue importing it directly.
import './styles/InlineToolbar.css';
import './styles/app.css';

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it
let root = document.createElement('div');

// Append root div to body
root.id = 'root';
document.body.appendChild(root);

// Render the app into the root div
render(<App />, document.getElementById('root'));
