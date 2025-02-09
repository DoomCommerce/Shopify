---
description : Snippet for capturing a section Id.
permalink : Snippets/Section-Id
title : Section Id
---

The following code snippet captures a `sectionId` that  
points to the section wrapper that Shopify generates.

```liquid
{%- liquid

    capture sectionId
        echo 'shopify-section-'
        echo section.id
    endcapture

-%}
```

<br/>

## + CSS Variables

The `sectionId` can directly be used  
to declare section scoped variables.

```liquid
<style>

    #{{- sectionId -}}{
        ---Variable : {{- value -}} ;
    }

</style>
```
