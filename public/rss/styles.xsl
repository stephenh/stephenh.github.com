<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title><xsl:value-of select="/rss/channel/title"/> RSS Feed</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #24292e;
            background-color: #fff;
            margin: 0;
            padding: 20px;
          }
          
          a {
            color: #0366d6;
            text-decoration: none;
          }
          
          a:hover {
            text-decoration: underline;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            padding-bottom: 20px;
            border-bottom: 1px solid #eaecef;
            margin-bottom: 20px;
          }
          
          .header h1 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 24px;
            font-weight: 600;
          }
          
          .header p {
            margin-top: 0;
            margin-bottom: 0;
            color: #586069;
          }
          
          .feed-info {
            margin-bottom: 20px;
            font-size: 14px;
          }
          
          .feed-info p {
            margin: 5px 0;
          }
          
          .item {
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eaecef;
          }
          
          .item:last-child {
            border-bottom: none;
          }
          
          .item h2 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 20px;
            font-weight: 600;
          }
          
          .item-meta {
            font-size: 14px;
            color: #586069;
            margin-bottom: 10px;
          }
          
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eaecef;
            font-size: 14px;
            color: #586069;
          }
          
          @media (max-width: 600px) {
            body {
              padding: 10px;
            }
            
            .header h1 {
              font-size: 20px;
            }
            
            .item h2 {
              font-size: 18px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1><xsl:value-of select="/rss/channel/title"/></h1>
            <p><xsl:value-of select="/rss/channel/description"/></p>
          </div>
          
          <div class="feed-info">
            <p>This is an RSS feed. To subscribe to this feed, copy the URL from your browser's address bar into your feed reader.</p>
            <p>URL: <code><xsl:value-of select="/rss/channel/link"/></code></p>
            <p>Last updated: <xsl:value-of select="/rss/channel/lastBuildDate"/></p>
          </div>
          
          <div class="items">
            <xsl:for-each select="/rss/channel/item">
              <div class="item">
                <h2><a href="{link}" target="_blank"><xsl:value-of select="title"/></a></h2>
                <div class="item-meta">
                  <p>
                    Published: <xsl:value-of select="pubDate"/>
                  </p>
                </div>
                <div class="item-content">
                  <xsl:value-of select="description" disable-output-escaping="yes"/>
                </div>
                <p><a href="{link}" target="_blank">Read more...</a></p>
              </div>
            </xsl:for-each>
          </div>
          
          <div class="footer">
            <p>RSS feed powered by <a href="https://astro.build/" target="_blank">Astro</a>.</p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>