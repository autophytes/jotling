import React, { createContext, useEffect, useState } from 'react';
import { getEditorStateWordCount } from '../components/editor/editorFunctions';

export const StatsContext = createContext();

// CONSTANTS

const StatsContextProvider = (props) => {
	// STATE
	const [origDocWordCountObj, setOrigDocWordCountObj] = useState({});
	const [docWordCountObj, setDocWordCountObj] = useState({});
	const [docWordCount, setDocWordCount] = useState(0);
	console.log('docWordCount:', docWordCount);
	const [sessionWordCount, setSessionWordCount] = useState(0);
	console.log('sessionWordCount:', sessionWordCount);

	// Updates the current doc's net word count
	useEffect(() => {
		const newDocTotal = Object.values(docWordCountObj).reduce((acc, val) => acc + val, 0);
		const origDocTotal = Object.values(origDocWordCountObj).reduce((acc, val) => acc + val, 0);

		setDocWordCount(newDocTotal - origDocTotal);
	}, [origDocWordCountObj, docWordCountObj]);

	// Does a final word count on the current doc, then moves the net to the sessionWordCount
	const finalizeDocWordCount = (editorState) => {
		console.log('finalizing word count');
		// Call one final update of the doc word count, return that obj (don't set)
		const newDocWordCountObj = getEditorStateWordCount(editorState);
		console.log('newDocWordCountObj (all words in old doc):', newDocWordCountObj);

		const newDocTotal = Object.values(newDocWordCountObj).reduce((acc, val) => acc + val, 0);
		console.log('newDocTotal:', newDocTotal);
		const origDocTotal = Object.values(origDocWordCountObj).reduce((acc, val) => acc + val, 0);
		console.log('origDocTotal:', origDocTotal);

		setSessionWordCount((prev) => prev + (newDocTotal - origDocTotal));
		setOrigDocWordCountObj({});
		setDocWordCountObj({});
	};

	// On new document load, set the base and current docWordCountObj's
	const initializeDocWordCount = (editorState) => {
		console.log('initializing word count');
		const newDocWordCountObj = getEditorStateWordCount(editorState);

		setOrigDocWordCountObj(newDocWordCountObj);
		setDocWordCountObj(newDocWordCountObj);
	};

	console.log('docWordCountObj: ', docWordCountObj);

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
