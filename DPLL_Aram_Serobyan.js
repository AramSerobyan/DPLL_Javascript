// -1 undefined; 0 false; 1 true;
var symbolProto = {
	'name': '',
	'val' : -1
};

// prototype for our cluases
// it has the content: elements of the clause,  number of elements, number of known true or false elements 
// and final clause value , also trueCount <=1 since after it total value is already known.
var clauseProto = {
	
	'content' : '',
	'count'  : 0,
	'falseCount': 0,
	'trueCount' : 0, 
	'clauseValue': -1
	
};


// Function for converting our content into three data structures. array of Clauses, of Symbols and an emptyarray of Model (to be filled later)
function DPLLSatisfiable(str) 
{
	var symbols =[]; 
	var model =[];
	var clauses = [];
	var tmp = ''; // temporary content for keeping parts of the clauses
	clauses.push( Object.create(clauseProto)); // starting with the first object
	clauses[0].clauseValue = -1;clauses[0].trueCount = 0;clauses[0].falseCount = 0;
	clauses[0].content=',';
	var new_sym = false; // is true when we met symbol in the text, aimed for populating the symbols array
	var clause_length=0; // the length of our array to not call length function to many times.
	
	for(var i = 0; i< str.length;i++) // We Parse content in our desired way
	{	
		if(str[i] === "-") { clauses[clause_length].content+= "-"; } // add the negation sign; problem statement dind't ask for multiple negations
																	 // but in that case we will count amount of '-' and take %2 to put it infront or not
		else if (str[i] ==="{") { new_sym =true; tmp+="\{";} // a new symbol is met
		else if (str[i] ==='}') // end of the symbol
		{	
			tmp+="}";
			new_sym = false;
			if(findSym(symbols,tmp)) // if symbol exists in our array we don't add it again
			{
				clauses[clause_length].content+= tmp; clauses[clause_length].count++; 
				
			}
			else
			{
				
				symbols.push({ 'name' : tmp, 'val' : -1});
				clauses[clause_length].content+= tmp; clauses[clause_length].count++;
			}
			tmp = ''; // reset our content
		}
		else if(new_sym) // while we are dealing with a new symbol we add characters to the array
		{ 
			if(str[i] === '_') //regexp is no friends those symbols, regexp dislikes symbols, regexp asks Aram to ignore those symbosl (c) regexp
			{ }
			else if(str[i] === '(')
			{ }
			else if(str[i] === ',')
			{ }
			else if(str[i] === ')')
			{}
			else
			{ tmp += str[i]; }
		}
		else if(str[i]=== '&') // new clause is ahead
		{
			clauses.push( Object.create(clauseProto));
			clause_length++;
			clauses[clause_length].clauseValue = -1;clauses[clause_length].trueCount = 0;clauses[clause_length].falseCount = 0;
			clauses[clause_length].content=',';
			tmp = '';
		}
		else if(str[i]==='|') {} // ignore or's 
		else 
		{	// For debuging purposes, also if user inputs {A}&%{B} it will activate
			console.log('an unexpected symbol is met, please rerun the program or turn off your computer');
		}
	}
	return DPLL(clauses,symbols,model); // Run our main function
};

function findSym(sym,tmp) // Description aforementioned.
{ //Avoiding replicate symbols
	for(var i =0; i<sym.length;i++)
	if( sym[i].name === tmp) return true;

	return false;
};

function DPLL(clauses,symbols,model) 
	
{  // Main algorithm
	if(isClausesTrue(clauses)) return true; 
	else if(isClausesFalse(clauses)) { return false; }
	 var P = FindPureSymbol(clauses,symbols);
	if(P!=null) 
	{
		clauses = UpdateClauses(P,clauses);
		symbols = remove(P,symbols);
		model.push(P);
		return DPLL(clauses,symbols,model);
	}
	var N = FindUnitClause(clauses,symbols);
	if(N!=null) 
	{
		clauses = UpdateClauses(N,clauses,symbols);
		symbols = remove(N,symbols);
		model.push(N);
		return DPLL(clauses,symbols,model);
	}
	//console.log(clauses,symbols,model); for testing purposes
	return DPLLGuess(clauses,symbols,model); // separate function for the last step 
};
function isClausesTrue(clauses)
{ // if every clause is true than we are done
	for(var i = 0;  i < clauses.length ; i++)
		if(clauses[i].clauseValue != 1) return false;
	return true;
};
function isClausesFalse(clauses)
{// if we have a one and component evaluating to false than we are sadly done as well
	for(var i = 0;  i < clauses.length ; i++)
		if(clauses[i].clauseValue === 0) return true;
	return false;
};

function FindPureSymbol(clauses,symbols)
{	 // Trying to find pure symbols
	for(var i = 0; i<symbols.length; i++) // for all symbols we need to check and return as soon as we found one
	{
		var isNegated = true;
		var isFirst   = true;
	 // our first character is { which is defined in Regexp thus we need \ to cancel it and one more \ to cancel effect of \ in first content thus "\\"
		var expN = "-\\"; expN+= symbols[i].name; 
		var expP = "[^-]\\"; expP+= symbols[i].name;  
		var regN = new RegExp(expN);
		var regP = new RegExp(expP);
		var isPar = false;
		var isNotPar = false;
		for(var j = 0; j< clauses.length; j++)// go over all clauses
		{
			isPar =false;
			isNotPar = false;
			if(clauses[j].clauseValue === 1 || clauses[j].clauseValue === 0 ) {} // check if clause is already true or false
			else
			{
				if( regP.test(clauses[j].content))
				{	isPar = true; }
				if( regN.test(clauses[j].content))
				{	isNotPar = true; }
				if( j === clauses.length -1) // we are in the last clause, either our symbol is pure or not
				{
					if( isFirst ) // if we haven't met it before.
					{
						if(isPar && isNotPar)
						{ // the last clause contains tautology. Shouldn't be considered.
						}
						else if(isNotPar)  // .match(regN)) works slower thus we use test
						{	
							//	P.name = symbols[i].name; P.val = 0; return P;
								return { 'name': symbols[i].name, 'val': 0 };
							
						}
						else if(isPar)
						{	
								return { 'name': symbols[i].name, 'val': 1 };
						}
						
					}
					else // isNegated set to the negation status of parameter when we first met it. If until the ent negation status was the same then its Pure
					{
						if(isNotPar && isNegated) 
							return { 'name': symbols[i].name, 'val': 0 };
						else if(isPar &&!isNegated)
							return { 'name': symbols[i].name, 'val': 1 };
					}
				}
				if( isPar && isNotPar)
				{ // tautology, shouldn't be considered
				}
				if(isFirst) //first match ,we need to set isNegated
				{
					
					if(isNotPar) 
						{isFirst = false; isNegated = true;}
					else if(isPar)
						{isFirst = false; isNegated = false;}
				}
				else // if variable is not pure than it is matched in two clauses with different negation values
				{
					if(isNotPar && !isNegated) { j = clauses.length +2;} 
				 	else if( isPar && isNegated) {j = clauses.length +2;}
				}
				
			}
		}
	}
	return null;
};

function FindUnitClause(clauses,symbols)
{	 	// searching for unit cluasues
	for(var i = 0; i<symbols.length; i++)  // Again we go over all symbols and look if the clause has only one undefined variable then we try to find it
	{ // using model and clauses wouldmake us after finding the clause with one element go over model and find which elements were initialized and which didn't
		var expN = "-\\"; expN+= symbols[i].name; 
		var expP = "[^-]\\"; expP+= symbols[i].name;  
		var regN = new RegExp(expN);
		var regP = new RegExp(expP);	
		for(var j = 0; j< clauses.length; j++)
		{
			if( clauses[j].count === (clauses[j].falseCount  + 1)) // one symbol remains undefined in clause
			{
				if(regN.test(clauses[j].content )) // simbol was negated 
				{ 
					return { 'name': symbols[i].name, 'val': 0 }; 
				}
				else if(regP.test(clauses[j].content )) // symbol wasn't negated
					return { 'name': symbols[i].name, 'val': 1 };
			}
			else {}	  // not a unit clause 
		}	
	}
	return null;
};
function UpdateClauses(P,clauses)
{ // updating counters of clauses to help in other functions ;
		//console.log(clauses);
		var expN = "-\\"; expN+= P.name; 
		var expP = "[^-]\\"; expP+= P.name;  
		var regN = new RegExp(expN);
		var regP = new RegExp(expP);
		var isPar =false;
		var	isNotPar = false;
		for(var j = 0; j< clauses.length; j++) // go over all clauses and see if our new symbol affects their count
		{
			isPar =false;
			isNotPar = false;
			if(clauses[j].clauseValue === 1 || clauses[j].clauseValue === 0 ) {} // clause is already determined to be T/F already
			else
			{
				if( regP.test(clauses[j].content))
				{	isPar = true; }
				if( regN.test(clauses[j].content))
				{	isNotPar = true; }
				if( isPar&&isNotPar)
				{
					clauses[j].clauseValue = 1;
				}
				else if(isNotPar)  // If -{P} is met
					{
					if(P.val === 0) // P val = 0 when it is false thus we got True symbol here
						{clauses[j].trueCount++; clauses[j].clauseValue=1;} // Set clause value to true since we have only or's in clause. do a happy dance
					else if(P.val ===1)// val = 1 then symbol evaluates to false 
						{
							clauses[j].falseCount++;
							if(clauses[j].count === clauses[j].falseCount) // if all symbols in clause evaluated to false set its value to false
							{clauses[j].clauseValue=0;}				   //this branch of DPLL is finished, next time when it would run it would return false
						}
					}
				else if(isPar) // same for the next case
					{
						if(P.val === 1)
						{clauses[j].trueCount++; clauses[j].clauseValue=1;}
						else if(P.val ===0)
						{
						clauses[j].falseCount++;
						if(clauses[j].count === clauses[j].falseCount)
							{clauses[j].clauseValue=0;}
						}

					} // we don't care if there is no match, since it doesn't affect our program thus no else followed
				
				
			}
		}
		return clauses; // return updated clauses
};
function remove(P,symbols)
{  // Removing element by ancient ways; that is creating a new array with everything but it;
	var newSymbols = [];
;
	for(var i =0; i<symbols.length; i++)
	{	
		if(symbols[i].name !== P.name)
		{
		 newSymbols.push(symbols[i]);
		}
	}
	return newSymbols;
};

function DPLLGuess(clauses,symbols,model)
{ // Function for guessing a variable. By default we take the first symbol in symbols;
	if(symbols.length=== 0 )
	{	
		console.log(clauses);
		if(isClausesTrue(clauses)) return true; 
		else if(isClausesFalse(clauses)) { return false; }
		
	}
	//console.log(symbols.length);
	var P = { 'name': symbols[0].name,'val' : 1};// brnaches to var = true and false;
	var M = { 'name': symbols[0].name, 'val': 0};
	symbols = remove(P,symbols);
	var cl1= JSON.parse(JSON.stringify(clauses)); // copying objects 
	var cl2= JSON.parse(JSON.stringify(clauses));  // since we have no functions in objects simple jason deepcopy will work
	var sm1= JSON.parse(JSON.stringify(symbols));
	var sm2= JSON.parse(JSON.stringify(symbols));
	var md1= JSON.parse(JSON.stringify(model));
	var md2= JSON.parse(JSON.stringify(model));
	cl1 = UpdateClauses(M,cl1); md1.push(M);
	cl2 = UpdateClauses(P,cl2); md2.push(P);
	return ( DPLL(cl1,sm1,md1) || DPLL(cl2,sm2,md2)); // branch into P = true and P = false
};


// Ask User to provide us with a content
var str = prompt('Write a CNF logical expression');
console.log( str);
console.log(DPLLSatisfiable(str));
// uncomment for testing
/*
console.log(DPLLSatisfiable('{A}|{B}&{A}|{B}'));// true
console.log(DPLLSatisfiable('{A}|{B}&{A}|-{B}'));//  true
console.log(DPLLSatisfiable('{A}|{B}&-{A}|-{B}'));//  true
console.log(DPLLSatisfiable('{A}|-{B}&-{A}|-{B}'));// true
console.log(DPLLSatisfiable('-{A}|-{B}&-{A}|-{B}'));// true
console.log(DPLLSatisfiable('{A}&-{A}'));// false
console.log(DPLLSatisfiable('{A}|{B}&-{A}&-{B}'));// false
console.log(DPLLSatisfiable('{A}&{A}&{A}&{A}&{B}&{A}|{B}&-{A}|-{B}}'));// true
console.log(DPLLSatisfiable('{B}|{C}&{B}|-{C}&-{B}|{C}&-{B}|-{C}'));// false
console.log(DPLLSatisfiable('{A}&{B}&{Q}&-{Q}&{Q}|-{Q}'));// false
console.log(DPLLSatisfiable('{A}|-{A}&{A}'));// true
console.log(DPLLSatisfiable('{A}'));// true
console.log(DPLLSatisfiable('-{A}'));// true
*/



