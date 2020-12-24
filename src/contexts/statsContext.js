import React, { createContext, useEffect, useState } from 'react';
import { getEditorStateWordCount } from '../components/editor/editorFunctions';

export const StatsContext = createContext();

// CONSTANTS

const StatsContextProvider = (props) => {
	// STATE
	const [origDocWordCountObj, setOrigDocWordCountObj] = useState({});
	const [docWordCountObj, setDocWordCountObj] = useState({});
	const [docWordCount, setDocWordCount] = useState(0);
	const [sessionWordCount, setSessionWordCount] = useState(0);

	// Updates the current doc's net word count
	useEffect(() => {
		const newDocTotal = Object.values(docWordCountObj).reduce((acc, val) => acc + val, 0);
		const origDocTotal = Object.values(origDocWordCountObj).reduce((acc, val) => acc + val, 0);

		setDocWordCount(newDocTotal - origDocTotal);
	}, [origDocWordCountObj, docWordCountObj]);

	// Does a final word count on the current doc, then moves the net to the sessionWordCount
	const finalizeDocWordCount = (editorState) => {
		// Call one final update of the doc word count, return that obj (don't set)
		const newDocWordCountObj = getEditorStateWordCount(editorState);

		const newDocTotal = Object.values(newDocWordCountObj).reduce((acc, val) => acc + val, 0);
		const origDocTotal = Object.values(origDocWordCountObj).reduce((acc, val) => acc + val, 0);

		setSessionWordCount((prev) => prev + (newDocTotal - origDocTotal));
		setOrigDocWordCountObj({});
		setDocWordCountObj({});
	};

	// On new document load, set the base and current docWordCountObj's
	const initializeDocWordCount = (editorState) => {
		const newDocWordCountObj = getEditorStateWordCount(editorState);

		setOrigDocWordCountObj(newDocWordCountObj);
		setDocWordCountObj(newDocWordCountObj);
	};

	return (
		<StatsContext.Provider
			value={{
				docWordCount,
				sessionWordCount,
				setSessionWordCount,
				docWordCountObj,
				setDocWordCountObj,
				finalizeDocWordCount,
				initializeDocWordCount,
			}}>
			{props.children}
		</StatsContext.Provider>
	);
};

export default StatsContextProvider;
