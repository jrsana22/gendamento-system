
Commit changes
There was an error committing your changes: Someone has committed since you started editing. See what changed
Commit message
Update page.tsx
Extended description
Add an optional extended description...
Direct commit or PR

Commit directly to the main branch

Create a new branch for this commit and start a pull request Learn more about pull requests
Skip to content
jrsana22
gendamento-system
Repository navigation
Code
Issues
Pull requests
Actions
Projects
Wiki
Security and quality
Insights
Settings
Files
Go to file
t
.claude
.github
prisma
src
app
admin
api
dashboard
agendamentos
campanhas
crm
notificacoes
FixNotificationsButton.tsx
page.tsx
perfil
layout.tsx
page.tsx
login
globals.css
icon.tsx
layout.tsx
page.tsx
components
lib
cron-worker.ts
middleware.ts
supabase
.env.example
.gitignore
CLAUDE.md
Dockerfile
INCIDENT_LOG.md
agent-prompt.md
docker-compose.yml
next-env.d.ts
next.config.mjs
package-lock.json
package.json
postcss.config.js
tailwind.config.ts
tsconfig.json
tsconfig.tsbuildinfo
vercel.json
gendamento-system/src/app/dashboard/notificacoes
/
page.tsx
in
main

Edit

Preview
Indent mode

Spaces
Indent size

2
Line wrap mode

No wrap
Editing page.tsx file contents
205
206
207
208
209
210
211
212
213
214
215
216
217
218
219
220
221
222
223
224
225
226
227
228
229
230
231
232
233
234
235
236
237
238
239
240
241
242
243
244
245
246
247
248
249
250
251
252
253
254
255
256
257
                              : hasFailed
                              ? <XCircle className="h-3.5 w-3.5" />
                              : <Clock className="h-3.5 w-3.5" />}
                            {sentCount}/{total} enviados
                          </span>
                          <LeadActions appointmentId={appt.id} />
                        </div>
                      </div>

                      {/* Notification columns */}
                      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-slate-800 bg-gray-50 dark:bg-slate-800/30">
                        {notifs.map((n) => (
                          <div key={n.id} className="px-4 py-3 space-y-2">
                            {/* Type + dot */}
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${statusDot[n.status] ?? 'bg-gray-300'}`} />
                              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 tracking-wide">
                                {NOTIF_LABELS[n.type]}
                              </span>
                            </div>
                            {/* Status pill */}
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusPill[n.status] ?? ''}`}>
                              {NOTIF_STATUS_LABELS[n.status]}
                            </span>
                            {/* Times */}
                            <div className="space-y-0.5">
                              <p className="text-xs text-gray-400 dark:text-slate-500">
                                <span className="font-medium">Prev:</span> {fmtDateTime(n.scheduledAt)}
                              </p>
                              {n.sentAt && (
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  <span>Env:</span> {fmtDateTime(n.sentAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {Array.from({ length: 4 - notifs.length }).map((_, i) => (
                          <div key={i} className="px-4 py-3" />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

Use Control + Shift + m to toggle the tab key moving focus. Alternatively, use esc then tab to move to the next interactive element on the page.
