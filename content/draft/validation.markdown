Agreed this is heavy-handed, but fine for our simple app. 

Tangentially, handling "in-flight" data is interesting...think of Tessell, ideally you want all validation done against models (StringProperties/etc.), but what if you have some validation logic that should be done as the user types, and other than is after the user is done. ...do properties now have two values? An in-flight value, that some rules are for, and a regular value? Does this percolate all the way through to derived values/etc.? Seems annoying... 

Or, do models always get updated with the in-flight value, but we somehow delay processing rules (or just showing rules?) until the user tabs out? E.g. maybe until a property is touched, it updates on blur, but then once it's touched, it updates on key press. 

I think the "value change sometimes on blur, sometimes on key press" is a potential solution. But it's more of a heuristic.
