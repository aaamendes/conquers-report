(() => {
  'use strict';

  class FilterHosts {
    constructor() {
      this.list = document.getElementsByClassName("sub-li-item");
      this.search_input = document.getElementById("search-input");
      this.addEvent();
    }
    addEvent() {
      this.search_input.addEventListener("keyup", (e) => {
        let value = this.search_input.value;
        for(let i = 0; i < this.list.length; i++) {
          if(this.list[i].textContent.toLowerCase().includes(
            value.toLowerCase()
            )
          ) {
            this.list[i].style.display = "block";
          }
          else {
            this.list[i].style.display = "none";
          }
        }
      });
    }
  }

  class Expander {
    constructor(elem, target, cssVisibleAttribute, useOpacityActive=false) {
      this.elem = elem;
      this.target = target
      this.open = true;
      this.cssVisibleAttribute = cssVisibleAttribute;
      this.add_click_event();
      this.useOpacityActive = useOpacityActive;
    }

    add_click_event() {
      this.elem.addEventListener("click", (e) => {
        if(this.useOpacityActive)
          this.elem.style.opacity = (this.open) ? "0.5" : "1";
        this.target.style.display = (this.open) ? "none" : this.cssVisibleAttribute;
        this.open = !this.open;
      });
    }
  }
  /*** class Expander END *********************************/

  class HTMLBuilder {
    constructor(elem) {
      this.clicked_node = elem;
      this.obj = {};
      this.group = "";
      this.host_obj = {};
      this.host = "";
      this.error = "";
      this.html = "";
      this.json_string = "";
      this.contentNode = this.gid("host-content");
      this.check_error_set_color();
      this.add_click_event(elem);
      this.subListItemCssClass = "sub-li-item";
      this.activeListCssClass = "sub-li-item-active";
    }
    /*** constructor END ***************/

    /*
     * Check for error length in dataset-json
     * and sets hostname green for ok or red
     * if errors occured.
     */
    check_error_set_color() {
      this.json_string = this.clicked_node.dataset.json;

      /*
       * Get JSON object from dataset.
       */
      try {
        this.obj = JSON.parse(this.json_string)
      }
      catch(e) {
        let error = "[ERROR] No JSON data or erroneous data. This is a bug.";
        this.error = this.ce("p");
        this.error.textContent = error;
        this.error.classList.add("error-red");
        this.clicked_node.classList.add("error-red");
        return;
      }

      // Get first key with is the group name.
      for(let g in this.obj) {
        this.group = g;
        break;
      }

      // Get the host name and set object.
      for(let h in this.obj[this.group][0]) {
        this.host = h;
        this.host_obj = this.obj[this.group][0][h]
        break;
      }

      if(this.host_obj["errors"].length > 0)
        this.clicked_node.classList.add("error-red");
      else 
        this.clicked_node.classList.add("ok-green");
    }
    /*** check_error_set_color END *****/

    /*
     * shorteners
     */
    ce(elem) {
      return document.createElement(elem);
    }
    gid(elem) {
      return document.getElementById(elem);
    }
    gc(elem) {
      return document.getElementsByClassName(elem);
    }
    gt(elem) {
      return document.getElementsByTagName(elem);
    }
    /*** shorteners END ****************/

    set_active(elem) {
      let all_items = document.getElementsByClassName(this.subListItemCssClass);
      for(let i = 0; i< all_items.length; i++) {
        all_items[i].classList.remove(this.activeListCssClass);
      }

      elem.classList.add(this.activeListCssClass);
    }
    /*
     * Add click event for host item:
     *  * sets clicked elem avtive
     *  * builds html
     *  * shows html
     *  * makes tables expandable using class Expander
     */
    add_click_event(elem) {
      elem.addEventListener("click", (e) => {
        this.set_active(elem);
        this.buildHTML(elem);
        this.show_html().then(
          (resp) => {
            setTimeout(() => {
              let heads = document.getElementsByTagName("thead");

              for(let i = 0; i < heads.length; i++) {
                let target = heads[i].parentNode.getElementsByTagName("tbody")[0];
                let expander = new Expander(
                  heads[i],
                  target,
                  "table-row-group",
                  true
                );
              }
            }, 100);
          }
        )
      });
    }
    /*** add_click_event END ***********/

    create_commands_table(type) {
      const t = {
        table: { 
          node: this.ce("table")
        },
        thead: {
          tr: this.ce("tr"),
          node: this.ce("thead")
        },
        tbody: {
          node: this.ce("tbody")
        },
      };

      t.thead.node.appendChild(t.thead.tr);

      [
        type,
        "output"
      ].map((text, i) => {
        let th = this.ce("th");
        th.textContent = text;
        t.thead.tr.appendChild(th);
      });

      t.table.node.append(
        t.thead.node,
        t.tbody.node,
      );

      if(typeof(this.host_obj["config"]["settings"][type]) === "object") {
        /*
         * One array can be larger than the other.
         * Find the larger one and use its length in the for loop.
         */
        const len = (
          this.host_obj["config"]["settings"][type].length >
            this.host_obj["output"][type].length
        ) ? this.host_obj["config"]["settings"][type].length :
              this.host_obj["output"][type].length;

        for(let i = 0; i < len; i++) {
          let tr = this.ce("tr");
          let td1 = this.ce("td");
          let td2 = this.ce("td");

          td1.textContent = (
            typeof(this.host_obj["config"]["settings"][type][i]) === "undefined"
          ) ? "" : this.host_obj["config"]["settings"][type][i];
          td2.textContent = (
            typeof(this.host_obj["output"][type][i]) === "undefined"
          ) ? "" : this.host_obj["output"][type][i];

          tr.append(td1, td2);

          t.tbody.node.appendChild(tr);
        }
      }

      return t;
    }
    /*** create_commands_table END *****/

    buildHTML(elem) {
      // No dataset -> return
      // This should not happen.
      if(Object.keys(this.obj).length === 0)
        return;

      const body = this.ce("div");

      const heading = this.ce("h2");
      heading.textContent = `Host ${this.host}`;

      const hr = this.ce("hr");

      body.appendChild(heading);
      body.appendChild(hr);

      const div = this.ce("div");

      /*
       * Create summary table.
       */
      const summary = {
        table: {
          node: this.ce("table")
        },
        tbody: {
          node: this.ce("tbody"),
          tr: this.ce("tr"),
          group: {
            node: this.ce("td")
          },
          host: {
            node: this.ce("td"),
          },
          user: {
            node: this.ce("td"),
          },
          message: {
            node: this.ce("td")
          },
          rc: {
            node: this.ce("td")
          },
          errors: {
            node: this.ce("td")
          }

        },
        thead: {
          node: this.ce("thead"),
          tr: {
            node: this.ce("tr")
          },
          th: {
            group: {
              node: this.ce("th")
            },
            host: {
              node: this.ce("th")
            },
            user: {
              node: this.ce("th")
            },
            message: {
              node: this.ce("th")
            },
            rc: {
              node: this.ce("th")
            },
            errors: {
              node: this.ce("th")
            }
          }
        }
      };

      summary.table.node.append(
        summary.thead.node,
        summary.tbody.node
      );
      summary.thead.node.append(
        summary.thead.tr.node
      );
      summary.thead.tr.node.append(
        summary.thead.th.group.node,
        summary.thead.th.host.node,
        summary.thead.th.user.node,
        summary.thead.th.message.node,
        summary.thead.th.rc.node,
        summary.thead.th.errors.node,
      );
      [
        summary.thead.th.group.node,
        summary.thead.th.host.node,
        summary.thead.th.user.node,
        summary.thead.th.message.node,
        summary.thead.th.rc.node,
        summary.thead.th.errors.node,
      ].map((node, i) => { 
        node.setAttribute("scope", "col");

        switch(i) {
          case 0:
            node.textContent = "Group";
            break;
          case 1:
            node.textContent = "Host";
            break;
          case 2:
            node.textContent = "User";
            break;
          case 3:
            node.textContent = "Message";
            break;
          case 4:
            node.textContent = "rc";
            break;
          case 5:
            node.textContent = "Errors";
            break;
        }
      })

      /*
       * Create summary body.
       */

      summary.tbody.group.node.textContent = this.group;
      summary.tbody.host.node.textContent = this.host;
      summary.tbody.user.node.textContent = this.host_obj["config"]["credentials"]["user"];
      summary.tbody.message.node.textContent = this.host_obj["message"];
      if(this.host_obj["message"] !== "ok")
        summary.tbody.message.node.classList.add("error-red");
      summary.tbody.rc.node.textContent = this.host_obj["rc"];
      summary.tbody.errors.node.textContent = this.host_obj["errors"].length;
      if(this.host_obj["errors"].length > 0)
        summary.tbody.errors.node.classList.add("error-red");

      summary.tbody.node.appendChild(summary.tbody.tr);

      summary.tbody.tr.append(
        summary.tbody.group.node,
        summary.tbody.host.node,
        summary.tbody.user.node,
        summary.tbody.message.node,
        summary.tbody.rc.node,
        summary.tbody.errors.node,
      );

      /*** summary END *******************/

      /*
       * Create errors table.
       */
      const t_errors = {
        table: {
          node: this.ce("table"),
        },
        thead: {
          tr: this.ce("tr"),
          node: this.ce("thead"),
        },
        tbody: {
          node: this.ce("tbody"),
        }
      };

      let th = this.ce("th");
      th.textContent = "Errors";
      t_errors.thead.tr.appendChild(th);

      t_errors.thead.node.appendChild(
        t_errors.thead.tr
      );

      t_errors.table.node.append(
        t_errors.thead.node,
        t_errors.tbody.node
      );

      for(let e in this.host_obj["errors"]) {
        let tr = this.ce("tr");
        let td = this.ce("td");
        td.textContent = this.host_obj["errors"][e];
        tr.appendChild(td);
        t_errors.tbody.node.appendChild(tr);
      }

      /*
       * Create table for settings.
       */
      const settings = {
        table: { 
          node: this.ce("table")
        },
        thead: {
          tr: this.ce("tr"),
          node: this.ce("thead")
        },
        tbody: {
          tr: this.ce("tr"),
          node: this.ce("tbody")
        },
      };

      settings.thead.node.append(settings.thead.tr);
      settings.tbody.node.append(settings.tbody.tr)

      settings.table.node.append(
        settings.thead.node,
        settings.tbody.node,
      );

      for(let k in this.host_obj["config"]["settings"]) {
        // do not add cmds, yet 
        if(k.includes("cmds"))
          continue;
        
        let th = this.ce("th");
        th.textContent = k;
        settings.thead.tr.append(th)
        let td = this.ce("td");
        td.textContent = this.host_obj["config"]["settings"][k]
        settings.tbody.tr.append(td)
      }
      /*** settings table END ************/

      /*
       * Create cmds_before table.
       */
      const cmds_before = this.create_commands_table("cmds_before");
      const cmds_after = this.create_commands_table("cmds_after");
      const conf_cmds = this.create_commands_table("conf_cmds");

      div.append(
        summary.table.node,
        t_errors.table.node,
        settings.table.node,
        cmds_before.table.node,
        cmds_after.table.node,
        conf_cmds.table.node,
      );

      body.appendChild(div);

      /*
       * Set html.
       */
      this.html = body;

    }
    /*** buildHTML END *****************/

    show_html() {
      return new Promise((resolve, reject) => {
        this.contentNode.innerHTML = "";
        this.contentNode.appendChild(
          (this.error) ? this.error : this.html
        );

        resolve("ready");
      });
    }
  }
  /*** class HTMLBuilder END ******************************/

  /*
   * Make Groups expandable
   */
  const all_groups = document.getElementsByClassName("group-entry");
  for(let i = 0; i < all_groups.length; i++) {
    let expander = new Expander(all_groups[i], all_groups[i].nextSibling.nextSibling, "block");
  }

  /*
   * Show report when host clicked.
   */
  const all_lists = document.getElementsByClassName("hosts-nav-sub");
  for(let i = 0; i < all_lists.length; i++) {
    let all_hosts = all_lists[i].getElementsByTagName("li");
    for(let j = 0; j < all_hosts.length; j++) {
      try {
        let builder = new HTMLBuilder(all_hosts[j]);
      }
      catch(e) {
        console.log(e);
      }
    }
  }
  
  /*
   * Filter hosts.
   */
  const filter_hosts =  new FilterHosts();

})();
