
* Stub at each conceptual level
  * Consuming a SOAP API--make a StubHttp, test your SOAP implementation that way
  * *Using* your SOAP API, make a StubBlahApi, don't test your SOAP API clients with low-level HTTP non-sense

* Prefer keeping separate functions as separate layers instead of nesting
  * JpaUserRepo hides crowd vs. separate db/crowd API and clients just deal with it

* Have 1 high-level ThirdPartyGateway interface and leverage it as much as possible to hide all the "gunk" within behind the API. The API talks in your turns, with your types, with your assumptions. Make the ThirdPartyGatewayImpl do the dirty work of translation.

