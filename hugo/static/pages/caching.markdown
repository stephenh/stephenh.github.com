
* Write-through cache
  * E.g. cache.get('expensive', ...);
  * Invalidation happens on write, cache.put('expensive', ...new value...);
  * Limitation is that writer must be aware of the cache
  * Any data touched in the lambda put tell us when it changes
* TTL cache
  * Limitation is that stale values will lead to user confusion
  * Advantage is no/little coordination required with writer
* Pull cache
  * Downstream stream pulls on invalidation (TTL or other)
  * Advantage is better decoupling
* Push cache
  * Limitation is still some lag between write and push
  * Could push entire data set to each machine
  * Good for when data set is small
* Oplock cache
  * E.g. cache.get('expensive_{user.version}', ...);
  * When user.version ticks, all cache keys pop
  * Limitation is that writes need to know which versions to tick
  * Limitation is that readers need to get the latest version
  * Limitation is that any data in the lambda must have an oplock in the key

