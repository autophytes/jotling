import React, { useContext } from 'react';

import { StatsContext } from '../../../contexts/statsContext';

const LeftNavStats = () => {
	const { docWordCount, sessionWordCount } = useContext(StatsContext);

	const numOfWords = Math.max(0, docWordCount + sessionWordCount);
	return <p>{`${numOfWords} word${numOfWords === 1 ? '' : 's'} today.`}</p>;
};

export default LeftNavStats;
