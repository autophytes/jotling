import React, { createContext, useState, useRef, useEffect } from 'react';

const Store = require('electron-store');
const store = new Store();

export const SettingsContext = createContext();

const defaultSettings = {
	editorMaxWidth: 60,
	editorPadding: 5.0,
};

const SettingsContextProvider = (props) => {
	// STATE
	const [editorSettings, setEditorSettings] = useState({
		editorMaxWidth: defaultSettings.editorMaxWidth,
		editorPadding: defaultSettings.editorPadding,
	});
	const [showEditorSettings, setShowEditorSettings] = useState(false);

	// Initialize the values from electron-store
	useEffect(() => {
		let newEditorSettings = { ...editorSettings };

		for (let prop in editorSettings) {
			let newValue = store.get(`settings.${prop}`, null);
			if (newValue !== null) {
				newEditorSettings[prop] = newValue;
			} else {
				newEditorSettings[prop] = defaultSettings[prop];
			}
		}

		setEditorSettings(newEditorSettings);
	}, []);

	// Synchronize the editorSettings electron-store
	useEffect(() => {
		for (let prop in editorSettings) {
			console.log(prop);
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
