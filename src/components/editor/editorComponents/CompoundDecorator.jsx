import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { CompositeDecorator } from 'draft-js';
import { List } from 'immutable';

const DecoratorComponentComposition = (props) => {
	const { decoratorProps, decorators, keyTuple, ...allOtherProps } = props;

	const [componentIndex, setComponentIndex] = useState(-1);

	const getComponentForIndex = useCallback(
		(componentIndex) => {
			const NewComponent =
				componentIndex !== -1 && keyTuple[componentIndex]
					? decorators[componentIndex].getComponentForKey(keyTuple[componentIndex])
					: null;
			return NewComponent;
		},
		[decorators, keyTuple]
	);

	const getNextComponentIndex = useCallback(
		(componentIndex) => {
			console.log('componentIndex:', componentIndex);
			let slicedTuple = componentIndex > -1 ? keyTuple.slice(componentIndex + 1) : keyTuple;
			console.log('slicedTuple:', slicedTuple);
			let slicedIndex = slicedTuple.findIndex((item) => item !== null);
			console.log('slicedIndex:', slicedIndex);
			let newComponentIndex =
				componentIndex > -1 && slicedIndex > -1
					? slicedIndex + componentIndex + 1
					: slicedIndex;
			console.log('newComponentIndex:', newComponentIndex);
			return newComponentIndex;
		},
		[keyTuple]
	);

	const getComponentProps = useCallback(
		(componentIndex) => {
			// let componentIndex = keyTuple.findIndex((item) => item === key);
			if (componentIndex === -1) {
				return {};
			}
			return {
				...allOtherProps,
				...decoratorProps[componentIndex],
			};
		},
		[decoratorProps, allOtherProps]
	);

	useEffect(() => {
		let newComponentIndex = getNextComponentIndex();
		setComponentIndex(newComponentIndex);
	}, [keyTuple, getNextComponentIndex]);

	const Component = useMemo(() => getComponentForIndex(componentIndex), [
		componentIndex,
		getComponentForIndex,
	]);

	return (
		// Returns the final combined components
		<>
			{Component ? (
				<Component
					{...getComponentProps(componentIndex)}
					childDecorator={{
						currentIndex: componentIndex,
						getNextComponentIndex,
						getComponentForIndex,
						getComponentProps,
					}}>
					{props.children}
				</Component>
			) : (
				props.children
			)}
		</>
	);
};

export class CompoundDecorator {
	constructor(decorators = []) {
		// Create an array of CompositeDecorators
		console.log('constructing the compound decorator');
		this.decorators = decorators.map((decorator) => {
			return decorator.strategy && decorator.component
				? new CompositeDecorator([decorator])
				: decorator;
		});
	}

	getDecorations(block, contentState) {
		// Create a nested array, top level for each character and nested level for each decorator option
		const emptyTuples = Array(block.getText().length).fill(
			Array(this.decorators.length).fill(null)
		);

		// [
		// 	[1, null, null],
		// 	[1, null, null],
		// 	[1, null, 3],
		// 	[1, null, 3],
		// 	[null, null, 3],
		// ];

		// Populate our emptyTuples
		const decorations = this.decorators.reduce((tuples, decorator, index) => {
			// Returns an immutable array the length of the text with the decorator key for the correct location
			const blockDecorations = decorator.getDecorations(block, contentState);
			// [null, null, 3, 3, null]

			// For each top level character index, updates the nested decorator array with the appropriate character list array for that decorator
			return tuples.map((tuple, tupleIndex) => {
				return [
					...tuple.slice(0, index),
					// Only the decorator's index in the nested array gets updated
					blockDecorations.get(tupleIndex),
					...tuple.slice(index + 1),
				];
			});
		}, emptyTuples);

		// If any of the nested arrays are all nulls (no decorators), return null instead.
		// This prevents extra getComponentForKey calls.
		const cleanedDecorations = decorations.map((array) => {
			if (array.findIndex((item) => item !== null) !== -1) {
				return JSON.stringify(array);
			}
			return null;
		});

		// return List(decorations.map(JSON.stringify));
		return List(cleanedDecorations);

		// So if we had a 5 character string with 3 decorator options,
		// 	each "key" would be: 3 top level decorators
		/*
    [
     [null, null, 2],
     [null, null, 2],
     [null, null, 2],
     [null, null, 2],
     [null, null, 2],
    ] */
	}

	// Instead of expecting an actual key, it's our tuple from above
	getComponentForKey(key) {
		const tuple = JSON.parse(key);
		console.log('GetComponetForKey fired.');

		let counter = 0;
		for (let key of tuple) {
			if (key !== null) {
				counter++;
				if (counter === 2) {
					break;
				}
			}
		}

		// If we only have 1, just return that decorator.
		if (counter === 1) {
			const decoratorIndex = tuple.findIndex((item) => item !== null);
			const decorator = this.decorators[decoratorIndex];
			return decorator.getComponentForKey(tuple[decoratorIndex]);
		}

		// return NewComponet // give this extra props;

		// Returns a component
		return DecoratorComponentComposition;
	}

	getPropsForKey(key) {
		const tuple = JSON.parse(key);
		// console.log('GetPropsForKey fired.');
		return {
			decoratorProps: tuple.map((decoration, index) => {
				const decorator = this.decorators[index];
				return decoration !== null ? decorator.getPropsForKey(decoration) : {};
			}),
			decorators: this.decorators,
			keyTuple: tuple,
		};
	}
}
