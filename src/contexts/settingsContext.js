import React, { createContext, useState, useRef, useEffect } from 'react';

const Store = require('electron-store');
const store = new Store();

export const SettingsContext = createContext();

const defaultSettings = {
	editorMaxWidth: 60,
	editorPadding: 5.0,
	primaryColor: '#0095ff',
	primaryColorRgb: '0, 149, 255',
	primaryColorList: ['#C61F37', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505'],
};

const SettingsContextProvider = (props) => {
	// STATE
	const [editorSettings, setEditorSettings] = useState({
		editorMaxWidth: defaultSettings.editorMaxWidth,
		editorPadding: defaultSettings.editorPadding,
		primaryColor: '#0095ff',
		primaryColorRgb: '0, 149, 255',
		primaryColorList: ['#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505'],
	});
	const [showEditorSettings, setShowEditorSettings] = useState(false);

	// Initialize the values from electron-store
	useEffect(() => {
		let newEditorSettings = { ...editorSettings };

		for (let prop in editorSettings) {
			let newValue = store.get(`settings.${prop}`, null);
			console.log(newValue);
			if (newValue !== null) {
				newEditorSettings[prop] = newValue;
			} else {
				newEditorSettings[prop] = defaultSettings[prop];
			}
		}

		// Load in our primary color
		const rootElement = document.querySelector(':root');
		rootElement.style.setProperty('--color-primary', newEditorSettings.primaryColor);
		rootElement.style.setProperty('--color-primary-rgb', newEditorSettings.primaryColorRgb);

		setEditorSettings(newEditorSettings);
	}, []);

	// Synchronize the editorSettings electron-store
	useEffect(() => {
		for (let prop in editorSettings) {
			console.log(prop, ': ', editorSettings[prop]);
			store.set(`settings.${prop}`, editorSettings[prop]);
		}
	}, [editorSettings]);

	console.log('editorSettings: ', editorSettings);

	// REFS
	const editorContainerRef = useRef(null);
	const editorPaddingWrapperRef = useRef(null);

	return (
		<SettingsContext.Provider
			value={{
				editorSettings,
				setEditorSettings,
				showEditorSettings,
				setShowEditorSettings,
				editorContainerRef,
				editorPaddingWrapperRef,
				defaultSettings,
			}}>
			{props.children}
		</SettingsContext.Provider>
	);
};

export default SettingsContextProvider;
