<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Aion - Dardok</title>
        <link rel="shortcut icon" href="https://cdn.ncwest.com/aion/01242023-DAEC1A83EB9E8666/images/global/AN-favicon-192x192.png">
        <meta charset="utf-8">
        <meta content="IE=edge,chrome=1" http-equiv="X-UA-Compatible">
        <meta content="Page par défaut" name="description">
        <meta content="width=device-width, initial-scale=1" name="viewport">
        <style>
            * {                
                margin: 0;
                padding: 0;
            }

            body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100vw;
                height: 100vh;
                min-height: 675px;
                background-color: #F4F5FF;
            }

            h1 {
                font-family: 'DM Sans', sans-serif;
                font-size: 24px;
                font-weight: 700;
                letter-spacing: 0px;
                text-align: center;
                margin: 8px;
            }

            .content {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }

            .tool {                
                width: 500px;
                min-height: 150px;
            }

            .tool-container:hover {
                box-shadow: inset 0 0 8px 1px rgb(166 241 174);
            }

            .tool-container:active {
                box-shadow: inset 0 0 8px 1px #8aecff;
            }

            .tool-container:hover #stigma-tool-img {
                background-position: -80px 0;
            }

            .tool-container:active #stigma-tool-img {
                background-position: -80px -80px;
            }

            a:link, a:visited, a:hover, a:active {
                color: inherit;
                text-decoration: none;
            }
            
            .tool-container {
                display: flex;
                justify-content: space-around;
                align-items: center;
                border: 2px solid #2d251f;
                border-radius: 5px;
                height: 100%;
                background-color: #312919;
                box-sizing: border-box;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                color: #695434;
                font-size: 1.2em;
                font-family: Verdana;
                text-transform: uppercase;
            }

            #stigma-tool-img {
                background-image: url('stigma/img/stigmaslots.png');
                width: 80px;
                height: 80px;
            }

            .navigation {
                width: 100%;
                height: 72px;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                background-color: #3f6a94;
                color: #F4F5FF;
            }
        </style>
    </head>
    <body>
        <nav class="navigation">
            <h1>Aion Tools</h1>
        </nav>
        <div class="content">
            <a class="tool" href="stigma">
                <div class="tool-container">
                    <div id="stigma-tool-img"></div> 
                    <h2>Stigma Calculator</h2>
                </div>
            </a>            
        </div>
    </body>
</html>